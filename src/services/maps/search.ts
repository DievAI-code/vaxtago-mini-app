"use client";

import { geocodingService, GeocodingResult } from "@/services/geocodingService";

export type ObjectType =
  | "railway_station"
  | "bus_station"
  | "airport"
  | "hospital"
  | "metro"
  | "migration"
  | "general";

export interface NormalizedMapQuery {
  originalQuery: string;
  city: string | null;
  objectType: ObjectType;
  formattedQuery: string;
  keywords: string[];
}

export interface MapSearchResult {
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  type?: string;
  source: "2gis";
  score?: number;
}

export interface RouteDetail {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][];
  source: "osrm";
}

export interface RouteOptions {
  from: [number, number]; // [lat, lng]
  to: [number, number];   // [lat, lng]
  mode?: "driving" | "foot";
}

const CITY_DICTIONARY: Record<string, string> = {
  тюмень: "Тюмень",
  tyumen: "Тюмень",
  тюменда: "Тюмень",
  тюменга: "Тюмень",
  москва: "Москва",
  moskva: "Москва",
  москве: "Москва",
  ташкент: "Ташкент",
  tashkent: "Ташкент",
  toshkent: "Ташкент",
  спб: "Санкт-Петербург",
  питер: "Санкт-Петербург",
  санктпетербург: "Санкт-Петербург",
  казань: "Казань",
  kazan: "Казань",
  новосибирск: "Новосибирск",
  екатеринбург: "Екатеринбург",
  самара: "Самара",
  уфа: "Уфа",
  омск: "Омск",
  краснодар: "Краснодар",
  челябинск: "Челябинск",
  сургут: "Сургут",
  нижневартовск: "Нижневартовск",
  тобольск: "Тобольск",
};

/**
 * Normalizes short/messy user queries into structured 2GIS search targets
 */
export function normalizeMapQuery(rawQuery: string): NormalizedMapQuery {
  const clean = rawQuery.trim().toLowerCase();
  const tokens = clean.split(/\s+/);

  let detectedCity: string | null = null;
  let objectType: ObjectType = "general";
  let targetPrefix = "";

  // 1. Detect City
  for (const token of tokens) {
    const key = token.replace(/[^a-zа-яё]/gi, "");
    if (CITY_DICTIONARY[key]) {
      detectedCity = CITY_DICTIONARY[key];
      break;
    }
  }

  // 2. Detect Object Type & Priorities
  if (/автовокзал|avtovokzal|автостанци/i.test(clean)) {
    objectType = "bus_station";
    targetPrefix = "автовокзал";
  } else if (
    /вокзал|жд|ж\/д|ж\.д|temir yol|temir yo'l|vokzal|railway|пассажирский/i.test(clean)
  ) {
    objectType = "railway_station";
    targetPrefix = "железнодорожный вокзал";
  } else if (/аэропорт|airport|aeroport/i.test(clean)) {
    objectType = "airport";
    targetPrefix = "аэропорт";
  } else if (/больниц|hospital|shifoxona|поликлиник/i.test(clean)) {
    objectType = "hospital";
    targetPrefix = "больница";
  } else if (/метро|metro/i.test(clean)) {
    objectType = "metro";
    targetPrefix = "станция метро";
  } else if (/мвд|мфц|миграц|паспортн/i.test(clean)) {
    objectType = "migration";
    targetPrefix = "миграционный центр";
  }

  // 3. Build Formatted Query for 2GIS
  let formattedQuery = "";
  if (targetPrefix && detectedCity) {
    formattedQuery = `${targetPrefix} ${detectedCity}`;
  } else if (targetPrefix) {
    const remainingText = tokens
      .filter(
        (t) =>
          !/жд|ж\/д|ж\.д|вокзал|vokzal|temir|yol|railway|аэропорт|airport|больница|hospital/i.test(
            t
          )
      )
      .join(" ");
    formattedQuery = remainingText ? `${targetPrefix} ${remainingText}` : targetPrefix;
  } else if (detectedCity) {
    const mainKeywords = tokens
      .filter((t) => !CITY_DICTIONARY[t.replace(/[^a-zа-яё]/gi, "")])
      .join(" ");
    formattedQuery = mainKeywords ? `${mainKeywords} ${detectedCity}` : detectedCity;
  } else {
    formattedQuery = rawQuery.trim();
  }

  return {
    originalQuery: rawQuery,
    city: detectedCity,
    objectType,
    formattedQuery,
    keywords: tokens,
  };
}

/**
 * Calculates a relevance score for a 2GIS candidate based on city and object type matching
 */
function scoreCandidate(
  candidate: GeocodingResult,
  normalized: NormalizedMapQuery
): number {
  let score = 0;
  const title = (candidate.name || candidate.display_name).toLowerCase();
  const address = candidate.display_name.toLowerCase();

  // City match (+50)
  if (normalized.city) {
    const cityLow = normalized.city.toLowerCase();
    if (address.includes(cityLow) || title.includes(cityLow)) {
      score += 50;
    } else {
      score -= 30; // Penalty if object is in a different region
    }
  }

  // Object Type match
  switch (normalized.objectType) {
    case "railway_station":
      if (title.includes("железнодорожный вокзал") || title.includes("ж/д вокзал") || title.includes("пассажирский вокзал")) {
        score += 50;
      } else if (title.includes("вокзал")) {
        score += 35;
      }
      // Penalty for remote small stations/stops like "Демьянка"
      if (title.includes("станция") && !title.includes("главный") && !title.includes("пассажирский") && !title.includes("вокзал")) {
        score -= 25;
      }
      break;

    case "bus_station":
      if (title.includes("автовокзал") || title.includes("автостанция")) {
        score += 50;
      }
      break;

    case "airport":
      if (title.includes("аэропорт") || title.includes("терминал")) {
        score += 50;
      }
      break;

    case "hospital":
      if (title.includes("больница") || title.includes("госпиталь")) {
        score += 50;
      }
      break;

    case "metro":
      if (title.includes("метро") || title.includes("станция")) {
        score += 40;
      }
      break;
  }

  // Direct title city keyword match (+20)
  if (normalized.city && title.includes(normalized.city.toLowerCase())) {
    score += 20;
  }

  return score;
}

export const hybridMapSearch = {
  normalizeQuery: normalizeMapQuery,

  async searchLocation(query: string): Promise<{ results: MapSearchResult[]; isLowConfidence: boolean }> {
    const normalized = normalizeMapQuery(query);
    
    // 1. Query 2GIS with the optimized query string
    let rawCandidates = await geocodingService.searchAddress(normalized.formattedQuery);

    // If normalized query returned no items, try original query
    if (rawCandidates.length === 0 && normalized.formattedQuery !== query) {
      rawCandidates = await geocodingService.searchAddress(query);
    }

    if (rawCandidates.length === 0) {
      return { results: [], isLowConfidence: false };
    }

    // 2. Score & Rank candidates
    const scoredCandidates = rawCandidates.map((c) => ({
      candidate: c,
      score: scoreCandidate(c, normalized),
    }));

    // Sort descending by score
    scoredCandidates.sort((a, b) => b.score - a.score);

    const sortedResults: MapSearchResult[] = scoredCandidates.map(({ candidate, score }) => ({
      title: candidate.name || candidate.display_name.split(",")[0],
      address: candidate.display_name,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      score,
      source: "2gis",
    }));

    // 3. Confidence Check
    const topScore = sortedResults[0]?.score ?? 0;
    const secondScore = sortedResults[1]?.score ?? 0;

    // Low confidence if top score is low OR top two candidates have very close scores
    const isLowConfidence = topScore < 40 || (sortedResults.length > 1 && Math.abs(topScore - secondScore) < 10);

    return {
      results: sortedResults,
      isLowConfidence,
    };
  },

  async buildRoute({ from, to, mode = "driving" }: RouteOptions): Promise<RouteDetail | null> {
    try {
      const profile = mode === "foot" ? "foot" : "car";
      const res = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`);
      if (res.ok) {
        const data = await res.json();
        const route = data.routes?.[0];
        if (route) {
          return {
            distanceMeters: route.distance,
            durationSeconds: route.duration,
            coordinates: route.geometry.coordinates,
            source: "osrm",
          };
        }
      }
    } catch {}
    return null;
  }
};

// ----------------------------------------------------
// Self-Testing Suite for Query Normalizer (Runs on load)
// ----------------------------------------------------
if (typeof window !== "undefined" && import.meta.env.DEV) {
  const tests = [
    { input: "тюмень жд вокзал", expectedQuery: "железнодорожный вокзал Тюмень", expectedType: "railway_station" },
    { input: "москва вокзал", expectedQuery: "железнодорожный вокзал Москва", expectedType: "railway_station" },
    { input: "ташкент аэропорт", expectedQuery: "аэропорт Ташкент", expectedType: "airport" },
    { input: "temir yol vokzal", expectedQuery: "железнодорожный вокзал", expectedType: "railway_station" },
    { input: "тюмень автовокзал", expectedQuery: "автовокзал Тюмень", expectedType: "bus_station" },
  ];

  tests.forEach((t) => {
    const res = normalizeMapQuery(t.input);
    const pass = res.formattedQuery === t.expectedQuery && res.objectType === t.expectedType;
    if (pass) {
      console.log(`[normalizeMapQuery Test PASS] "${t.input}" -> "${res.formattedQuery}" [${res.objectType}]`);
    } else {
      console.warn(`[normalizeMapQuery Test FAIL] "${t.input}" Expected: "${t.expectedQuery}", Got: "${res.formattedQuery}"`);
    }
  });
}