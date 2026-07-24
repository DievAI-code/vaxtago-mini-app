"use client";

import { get2GISMapKey } from "@/lib/env";
import { parseLocationQuery, ParsedLocationQuery } from "./maps/search";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  address?: string;
  source?: "2gis" | "osm";
}

/**
 * Generates city adjective for queries (e.g. Тюмень -> Тюменский)
 */
function getCityAdjective(city: string): string {
  if (city === "Тюмень") return "Тюменский";
  if (city === "Москва") return "Московский";
  if (city === "Санкт-Петербург") return "Санкт-Петербургский";
  if (city === "Казань") return "Казанский";
  if (city === "Ташкент") return "Ташкентский";
  if (city === "Екатеринбург") return "Екатеринбургский";
  if (city === "Новосибирск") return "Новосибирский";
  return `${city}ский`;
}

/**
 * Strict city filter: discards results belonging to other cities (e.g., Тобольск, Ишим, Демьянка)
 */
function filterByCityStrict(results: GeocodingResult[], targetCity: string): GeocodingResult[] {
  if (!targetCity) return results;

  const cityLow = targetCity.toLowerCase();

  return results.filter((item) => {
    const text = `${item.name || ""} ${item.display_name || ""} ${item.address || ""}`.toLowerCase();
    
    // Explicit exclusions when target city is set
    if (cityLow === "тюмень") {
      if (text.includes("тобольск") || text.includes("ишим") || text.includes("демьянка") || text.includes("заводоуковск")) {
        return false;
      }
    }

    return text.includes(cityLow);
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
            source: "2gis" as const,
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

/**
 * Fallback Geocoder using Nominatim OpenStreetMap API
 */
async function fetchNominatimOSM(query: string): Promise<GeocodingResult[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&addressdetails=1&limit=5&accept-language=ru`;

    const response = await fetch(url, {
      headers: { "User-Agent": "VAQTA-AI-Geocoder/1.0" },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.map((item: any) => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      display_name: item.display_name,
      name: item.nameddetails?.name || item.name || item.display_name.split(",")[0],
      address: item.display_name,
      source: "osm" as const,
    }));
  } catch (e) {
    console.error("[Nominatim Fetch Error]", e);
    return [];
  }
}

export const geocodingService = {
  /**
   * Smart POI-aware search logic
   */
  async searchPOI(parsed: ParsedLocationQuery, originalQuery: string): Promise<GeocodingResult[]> {
    const city = parsed.city;
    const objectType = parsed.objectType;

    // Generate candidate search queries depending on POI type
    const candidateQueries: string[] = [];

    if (city && objectType === "railway_station") {
      const adj = getCityAdjective(city);
      candidateQueries.push(`${adj} железнодорожный вокзал`);
      candidateQueries.push(`Железнодорожный вокзал ${city}`);
      candidateQueries.push(`Железнодорожный вокзал`);
      candidateQueries.push(`вокзал ${city}`);
      candidateQueries.push(`вокзал`);
    } else if (city && objectType === "bus_station") {
      candidateQueries.push(`Автовокзал ${city}`);
      candidateQueries.push(`Автовокзал`);
    } else if (city && objectType === "airport") {
      candidateQueries.push(`Аэропорт ${city}`);
      candidateQueries.push(`Аэропорт`);
    } else if (city && objectType === "hospital") {
      candidateQueries.push(`Больница ${city}`);
      candidateQueries.push(`Больница`);
    } else {
      if (parsed.searchQuery) candidateQueries.push(parsed.searchQuery);
      if (originalQuery !== parsed.searchQuery) candidateQueries.push(originalQuery);
      if (city) candidateQueries.push(city);
    }

    // 1. Try 2GIS Queries
    for (const q of candidateQueries) {
      const rawResults = await fetch2GISCatalog(q);
      const filteredResults = city ? filterByCityStrict(rawResults, city) : rawResults;

      // Debug Logs (Requirement)
      console.log("CITY:", city);
      console.log("OBJECT:", objectType);
      console.log("QUERY:", q);
      console.log("RAW RESULTS:", rawResults);
      console.log("FILTERED RESULTS:", filteredResults);

      if (filteredResults.length > 0) {
        return filteredResults;
      }
    }

    // 2. Fallback to Nominatim OpenStreetMap if 2GIS returns 0 results
    const fallbackQuery = city && objectType === "railway_station"
      ? `${getCityAdjective(city)} железнодорожный вокзал`
      : (parsed.searchQuery || originalQuery);

    console.log("[2GIS yielded 0 results -> FALLBACK to OpenStreetMap Nominatim]");
    console.log("OSM Fallback Query:", fallbackQuery);

    const osmRaw = await fetchNominatimOSM(fallbackQuery);
    const osmFiltered = city ? filterByCityStrict(osmRaw, city) : osmRaw;

    console.log("OSM RAW RESULTS:", osmRaw);
    console.log("OSM FILTERED RESULTS:", osmFiltered);

    return osmFiltered;
  },

  /**
   * Main address search interface
   */
  async searchAddress(originalQuery: string): Promise<GeocodingResult[]> {
    const original = originalQuery.trim();
    if (!original) return [];

    const parsed = parseLocationQuery(original);
    return await this.searchPOI(parsed, original);
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