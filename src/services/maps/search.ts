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

export interface ParsedLocationQuery {
  city: string | null;
  objectType: ObjectType;
  searchQuery: string;
}

export interface MapSearchResult {
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  type?: string;
  source: "2gis";
  score?: number;
  cityMatch?: boolean;
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
  // Тюмень
  тюмень: "Тюмень",
  tyumen: "Тюмень",
  тюменда: "Тюмень",
  тюменга: "Тюмень",
  tyumenda: "Тюмень",
  tyumenga: "Тюмень",
  
  // Москва
  москва: "Москва",
  moskva: "Москва",
  москве: "Москва",
  moskvada: "Москва",
  moskvaga: "Москва",

  // Ташкент
  ташкент: "Ташкент",
  tashkent: "Ташкент",
  toshkent: "Ташкент",
  тошкент: "Ташкент",

  // СПб
  спб: "Санкт-Петербург",
  питер: "Санкт-Петербург",
  санктпетербург: "Санкт-Петербург",
  spb: "Санкт-Петербург",

  // Казань
  казань: "Казань",
  kazan: "Казань",

  // Екатеринбург
  екатеринбург: "Екатеринбург",
  ekaterinburg: "Екатеринбург",

  // Новосибирск
  новосибирск: "Новосибирск",
  novosibirsk: "Новосибирск",

  // Самара / Уфа / Омск / Краснодар / Челябинск / Тобольск / Ишим
  самара: "Самара",
  уфа: "Уфа",
  омск: "Омск",
  краснодар: "Краснодар",
  челябинск: "Челябинск",
  сургут: "Сургут",
  нижневартовск: "Нижневартовск",
  тобольск: "Тобольск",
  ишим: "Ишим",
};

/**
 * 1. Smart Location Query Parser
 * Parses city, object type, and constructs an optimized 2GIS search string.
 */
export function parseLocationQuery(query: string): ParsedLocationQuery {
  const clean = query.trim().toLowerCase();
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

  // 2. Detect Object Type & Priority Terms (RU + UZ Latin & Cyrillic)
  if (/автовокзал|avtovokzal|автостанци/i.test(clean)) {
    objectType = "bus_station";
    targetPrefix = "Автовокзал";
  } else if (
    /вокзал|жд|ж\/д|ж\.д|железная дорога|temir yol|temir yo'l|темир йўл|vokzal|vokzali|railway/i.test(clean)
  ) {
    objectType = "railway_station";
    targetPrefix = "Железнодорожный вокзал";
  } else if (/аэропорт|airport|aeroport|аэропорта/i.test(clean)) {
    objectType = "airport";
    targetPrefix = "Аэропорт";
  } else if (/больниц|hospital|shifoxona|поликлиник/i.test(clean)) {
    objectType = "hospital";
    targetPrefix = "Больница";
  } else if (/метро|metro/i.test(clean)) {
    objectType = "metro";
    targetPrefix = "Станция метро";
  } else if (/мвд|мфц|миграц|паспортн|паспортный/i.test(clean)) {
    objectType = "migration";
    targetPrefix = "Миграционный центр";
  }

  // 3. Construct Standardized Search Query
  let searchQuery = "";
  if (targetPrefix && detectedCity) {
    searchQuery = `${targetPrefix} ${detectedCity}`;
  } else if (targetPrefix) {
    const remainingText = tokens
      .filter(
        (t) =>
          !/жд|ж\/д|ж\.д|вокзал|vokzal|temir|yol|темир|йўл|railway|аэропорт|airport|больница|hospital/i.test(
            t
          )
      )
      .join(" ");
    searchQuery = remainingText ? `${targetPrefix} ${remainingText}` : targetPrefix;
  } else if (detectedCity) {
    const mainKeywords = tokens
      .filter((t) => !CITY_DICTIONARY[t.replace(/[^a-zа-яё]/gi, "")])
      .join(" ");
    searchQuery = mainKeywords ? `${mainKeywords} ${detectedCity}` : detectedCity;
  } else {
    searchQuery = query.trim();
  }

  return {
    city: detectedCity,
    objectType,
    searchQuery,
  };
}

/**
 * Checks whether a candidate belongs to the requested target city.
 */
function isMatchingCity(candidate: GeocodingResult, targetCity: string): boolean {
  const cityLow = targetCity.toLowerCase();
  const addressLow = (candidate.address || candidate.display_name || "").toLowerCase();
  const nameLow = (candidate.name || "").toLowerCase();

  return addressLow.includes(cityLow) || nameLow.includes(cityLow);
}

/**
 * Calculates a relevance score for candidate items.
 */
function scoreCandidate(candidate: GeocodingResult, parsed: ParsedLocationQuery): number {
  let score = 0;
  const title = (candidate.name || candidate.display_name).toLowerCase();
  const address = (candidate.address || candidate.display_name).toLowerCase();

  // City Match (+100)
  if (parsed.city && isMatchingCity(candidate, parsed.city)) {
    score += 100;
  } else if (parsed.city) {
    score -= 100; // Strong penalty for other cities (e.g. Тобольск, Ишим)
  }

  // Object Type Score Boosts
  if (parsed.objectType === "railway_station") {
    if (title.includes("железнодорожный вокзал") || title.includes("ж/д вокзал") || title.includes("пассажирский вокзал")) {
      score += 80;
    } else if (title.includes("вокзал")) {
      score += 60;
    }
    // Main city station bonus
    if (parsed.city && title.includes(parsed.city.toLowerCase())) {
      score += 40;
    }
    // Penalty for small remote transit stations (e.g., "Станция Демьянка")
    if (title.includes("станция") && !title.includes("главный") && !title.includes("вокзал")) {
      score -= 30;
    }
  } else if (parsed.objectType === "bus_station") {
    if (title.includes("автовокзал") || title.includes("автостанция")) {
      score += 80;
    }
  } else if (parsed.objectType === "airport") {
    if (title.includes("аэропорт") || title.includes("терминал")) {
      score += 80;
    }
  }

  return score;
}

export const hybridMapSearch = {
  parseLocationQuery,

  async searchLocation(
    rawQuery: string
  ): Promise<{ results: MapSearchResult[]; isLowConfidence: boolean; message?: string }> {
    // 1. Parse Query
    const parsed = parseLocationQuery(rawQuery);

    // 2. Query 2GIS with the standardized search query
    let rawResults = await geocodingService.searchAddress(parsed.searchQuery);

    // Fallback to raw input if parsed search returned nothing
    if (rawResults.length === 0 && parsed.searchQuery !== rawQuery.trim()) {
      rawResults = await geocodingService.searchAddress(rawQuery);
    }

    // DEBUG LOGS (Requirement 7)
    console.log("Original query:", rawQuery);
    console.log("Parsed city:", parsed.city);
    console.log("Parsed object:", parsed.objectType);
    console.log("2GIS Query:", parsed.searchQuery);
    console.log("2GIS results (raw):", rawResults);

    if (rawResults.length === 0) {
      console.log("Filtered results: []");
      return {
        results: [],
        isLowConfidence: false,
        message: parsed.city ? `В шаҳарда (${parsed.city}) топилмади.` : "По запросу ничего не найдено.",
      };
    }

    // 3. Filter results by target city if specified
    let filtered = rawResults;
    if (parsed.city) {
      const cityFiltered = rawResults.filter((item) => isMatchingCity(item, parsed.city!));
      // Only apply strict filter if we found matches in that city
      if (cityFiltered.length > 0) {
        filtered = cityFiltered;
      }
    }

    // 4. Score and Rank candidates
    const scored = filtered.map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, parsed),
      cityMatch: parsed.city ? isMatchingCity(candidate, parsed.city) : true,
    }));

    scored.sort((a, b) => b.score - a.score);

    const sortedResults: MapSearchResult[] = scored.map(({ candidate, score, cityMatch }) => ({
      title: candidate.name || candidate.display_name.split(",")[0],
      address: candidate.display_name,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      score,
      cityMatch,
      source: "2gis",
    }));

    console.log("Filtered & Sorted results:", sortedResults);

    // 5. Confidence check & exact city match notice
    const hasExactCityMatch = parsed.city ? sortedResults.some((r) => r.cityMatch) : true;
    const topScore = sortedResults[0]?.score ?? 0;
    const isLowConfidence = !hasExactCityMatch || topScore < 50;

    let warningMessage: string | undefined = undefined;
    if (parsed.city && !hasExactCityMatch) {
      warningMessage = `В шаҳарда (${parsed.city}) точный объект не найден. Возможно вы имели в виду:`;
    }

    return {
      results: sortedResults,
      isLowConfidence,
      message: warningMessage,
    };
  },

  async buildRoute({ from, to, mode = "driving" }: RouteOptions): Promise<RouteDetail | null> {
    try {
      const profile = mode === "foot" ? "foot" : "car";
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
      );
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
  },
};

// ----------------------------------------------------
// Self-Tests (Runs in dev mode to verify parser behavior)
// ----------------------------------------------------
if (typeof window !== "undefined" && import.meta.env.DEV) {
  const tests = [
    { input: "тюмень жд вокзал", expectedCity: "Тюмень", expectedType: "railway_station", expectedQuery: "Железнодорожный вокзал Тюмень" },
    { input: "москва вокзал", expectedCity: "Москва", expectedType: "railway_station", expectedQuery: "Железнодорожный вокзал Москва" },
    { input: "ташкент аэропорт", expectedCity: "Ташкент", expectedType: "airport", expectedQuery: "Аэропорт Ташкент" },
    { input: "temir yol vokzal", expectedCity: null, expectedType: "railway_station", expectedQuery: "Железнодорожный вокзал" },
    { input: "tyumen vokzal", expectedCity: "Тюмень", expectedType: "railway_station", expectedQuery: "Железнодорожный вокзал Тюмень" },
    { input: "temir yol tyumen", expectedCity: "Тюмень", expectedType: "railway_station", expectedQuery: "Железнодорожный вокзал Тюмень" },
    { input: "tyumen temir yol vokzal", expectedCity: "Тюмень", expectedType: "railway_station", expectedQuery: "Железнодорожный вокзал Тюмень" },
  ];

  console.log("=== Running Location Query Parser Self-Tests ===");
  tests.forEach((t) => {
    const res = parseLocationQuery(t.input);
    const pass = res.city === t.expectedCity && res.objectType === t.expectedType && res.searchQuery === t.expectedQuery;
    if (pass) {
      console.log(`✅ [PASS] "${t.input}" -> "${res.searchQuery}" (${res.city || "no city"}, ${res.objectType})`);
    } else {
      console.warn(`❌ [FAIL] "${t.input}" -> Expected: "${t.expectedQuery}", Got: "${res.searchQuery}"`);
    }
  });
}