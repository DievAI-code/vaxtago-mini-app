"use client";

import { get2GISMapKey } from "@/lib/env";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  address?: string;
}

const KNOWN_CITIES = [
  { keys: ["тюмень", "tyumen", "тюменда", "тюменга"], name: "Тюмень" },
  { keys: ["москва", "moskva", "москве", "moskvada"], name: "Москва" },
  { keys: ["санкт-петербург", "спб", "питер", "spb"], name: "Санкт-Петербург" },
  { keys: ["казань", "kazan"], name: "Казань" },
  { keys: ["ташкент", "tashkent", "toshkent"], name: "Ташкент" },
  { keys: ["екатеринбург", "ekaterinburg"], name: "Екатеринбург" },
  { keys: ["новосибирск", "novosibirsk"], name: "Новосибирск" },
  { keys: ["самарканд", "samarkand"], name: "Самарканд" },
  { keys: ["алматы", "almaty"], name: "Алматы" },
];

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Extracts normalized target city from user input
 */
function detectCity(query: string): string | null {
  const low = normalizeQuery(query);
  for (const c of KNOWN_CITIES) {
    if (c.keys.some((k) => low.includes(k))) {
      return c.name;
    }
  }
  return null;
}

/**
 * Formats user query into a 2GIS-friendly query string
 */
function prepareQuery(query: string): string {
  const q = normalizeQuery(query);
  const city = detectCity(query);

  let objectPrefix = "";

  if (q.includes("автовокзал") || q.includes("avtovokzal")) {
    objectPrefix = "автовокзал";
  } else if (
    q.includes("вокзал") ||
    q.includes("жд") ||
    q.includes("ж/д") ||
    q.includes("vokzal") ||
    q.includes("temir yol")
  ) {
    objectPrefix = "Железнодорожный вокзал";
  } else if (q.includes("аэропорт") || q.includes("airport")) {
    objectPrefix = "аэропорт";
  }

  if (objectPrefix && city) {
    return `${objectPrefix} ${city}`;
  }

  return q;
}

/**
 * Strict city filter: discards results belonging to other cities (e.g., Тобольск, Ишим)
 */
function filterByCity(results: GeocodingResult[], targetCity: string): GeocodingResult[] {
  if (!targetCity) return results;

  const cityLow = targetCity.toLowerCase();

  return results.filter((item) => {
    const text = `${item.name || ""} ${item.display_name || ""} ${item.address || ""}`.toLowerCase();
    return text.includes(cityLow);
  });
}

/**
 * Sorts results by priority:
 * 1. Target city match
 * 2. Name contains "вокзал"
 * 3. Name contains "железнодорожный"
 */
function sortResults(results: GeocodingResult[], targetCity: string | null): GeocodingResult[] {
  const cityLow = targetCity ? targetCity.toLowerCase() : "";

  return [...results].sort((a, b) => {
    const aText = `${a.name || ""} ${a.display_name || ""}`.toLowerCase();
    const bText = `${b.name || ""} ${b.display_name || ""}`.toLowerCase();

    let aScore = 0;
    let bScore = 0;

    // 1. City Match
    if (cityLow) {
      if (aText.includes(cityLow)) aScore += 100;
      if (bText.includes(cityLow)) bScore += 100;
    }

    // 2. Contains "вокзал"
    if (aText.includes("вокзал")) aScore += 50;
    if (bText.includes("вокзал")) bScore += 50;

    // 3. Contains "железнодорожный" / "пассажирский"
    if (aText.includes("железнодорожный") || aText.includes("ж/д")) aScore += 30;
    if (bText.includes("железнодорожный") || bText.includes("ж/д")) bScore += 30;

    // Small remote stop penalty (e.g. "Станция Демьянка")
    if (aText.includes("станция") && !aText.includes("главный") && !aText.includes("пассажирский") && !aText.includes("вокзал")) aScore -= 20;
    if (bText.includes("станция") && !bText.includes("главный") && !bText.includes("пассажирский") && !bText.includes("вокзал")) bScore -= 20;

    return bScore - aScore;
  });
}

/**
 * Fetches raw items from 2GIS Catalog API
 */
async function fetch2GISCatalog(query: string): Promise<GeocodingResult[]> {
  const key = get2GISMapKey();
  if (!key) return [];

  try {
    const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(
      query
    )}&key=${key}&fields=items.geometry,items.full_name,items.address_name,items.name&limit=10`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    const items = data.result?.items || [];

    return items
      .map((item: any) => {
        let lat = item.point?.lat;
        let lon = item.point?.lon;

        if (lat && lon) {
          return {
            latitude: lat,
            longitude: lon,
            display_name: item.full_name || item.address_name || item.name,
            name: item.name,
            address: item.address_name || "",
          };
        }
        return null;
      })
      .filter(Boolean) as GeocodingResult[];
  } catch (e) {
    console.error("[2GIS Catalog Fetch Error]", e);
    return [];
  }
}

export const geocodingService = {
  /**
   * Multi-attempt search with fallbacks, city filtering, and priority ranking
   */
  async searchAddress(originalQuery: string): Promise<GeocodingResult[]> {
    const original = originalQuery.trim();
    if (!original) return [];

    const city = detectCity(original);
    const prepared = prepareQuery(original);

    // Build fallback search queries list
    const candidateQueries: string[] = [];

    // Attempt 1: Prepared query (e.g., "Железнодорожный вокзал Тюмень")
    if (prepared) {
      candidateQueries.push(prepared);
    }

    // Attempt 2: Original user query (e.g., "покажи вокзал тюмень на карте")
    if (!candidateQueries.includes(original)) {
      candidateQueries.push(original);
    }

    // Attempt 3 & 4: Direct city + object fallbacks
    if (city) {
      const isStation = /вокзал|жд|ж\/д|vokzal|temir/i.test(original);
      if (isStation) {
        const fallbacks = [`${city} вокзал`, `${city} железная дорога`];
        for (const fb of fallbacks) {
          if (!candidateQueries.includes(fb)) {
            candidateQueries.push(fb);
          }
        }
      }
    }

    // Execute fallback queries sequentially until we find valid city-filtered candidates
    let bestResults: GeocodingResult[] = [];

    for (let i = 0; i < candidateQueries.length; i++) {
      const q = candidateQueries[i];
      const rawResults = await fetch2GISCatalog(q);

      // Apply city filter if a city was specified
      let filtered = rawResults;
      if (city) {
        filtered = filterByCity(rawResults, city);
      }

      console.log(`[2GIS ATTEMPT ${i + 1}]`);
      console.log("query:", q);
      console.log("results (raw / filtered):", rawResults.length, "/", filtered.length);

      if (filtered.length > 0) {
        bestResults = sortResults(filtered, city);
        break; // Stop at first successful query attempt with results in the target city
      }
    }

    console.log("[2GIS FINAL RESULT COUNT]:", bestResults.length);
    return bestResults;
  },

  async searchAddressFull(query: string) {
    if (query.trim().length < 2) {
      return {
        isTooShort: true,
        results: [],
        error: "Введите адрес",
      };
    }

    const results = await this.searchAddress(query);

    return {
      isTooShort: false,
      results,
      error: results.length === 0 ? "Объект не найден" : null,
    };
  },
};