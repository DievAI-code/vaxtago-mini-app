"use client";

import { geocodingService, GeocodingResult } from "@/services/geocodingService";
import { expandOrganizationQuery } from "./organizationAliases";

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
  source: "2gis" | "osm" | "overpass";
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

  // Самара / Уфа / Омск / Краснодар / Челябинск / Тобольск / Ишим / Нижневартовск
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
 * Normalizes user text removing prefixes like г., г. , город, город.
 */
function cleanCityPrefixes(text: string): string {
  return text
    .toLowerCase()
    .replace(/г\.\s*/g, " ")
    .replace(/город\.\s*/g, " ")
    .replace(/город\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Removes quotes, punctuation, and extra whitespace for clean query fallback
 */
function cleanPunctuationAndQuotes(text: string): string {
  return text
    .replace(/["'«»’“”]/g, "")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Smart Location Query Parser
 * Parses city, object type, and constructs an optimized search string.
 */
export function parseLocationQuery(query: string): ParsedLocationQuery {
  const cleanedText = cleanCityPrefixes(query);
  const rawClean = query.trim().toLowerCase();
  const tokens = cleanedText.split(/\s+/);

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

  // Fallback check against raw query if not found
  if (!detectedCity) {
    for (const [key, cityName] of Object.entries(CITY_DICTIONARY)) {
      if (rawClean.includes(key)) {
        detectedCity = cityName;
        break;
      }
    }
  }

  // 2. Detect Object Type & Priority Terms (RU + UZ Latin & Cyrillic)
  if (/автовокзал|avtovokzal|автостанци/i.test(cleanedText)) {
    objectType = "bus_station";
    targetPrefix = "Автовокзал";
  } else if (
    /вокзал|жд|ж\/д|ж\.д|железная дорога|temir yol|temir yo'l|темир йўл|vokzal|vokzali|railway/i.test(cleanedText)
  ) {
    objectType = "railway_station";
    targetPrefix = "Железнодорожный вокзал";
  } else if (/аэропорт|airport|aeroport|аэропорта/i.test(cleanedText)) {
    objectType = "airport";
    targetPrefix = "Аэропорт";
  } else if (/больниц|hospital|shifoxona|поликлиник/i.test(cleanedText)) {
    objectType = "hospital";
    targetPrefix = "Больница";
  } else if (/метро|metro/i.test(cleanedText)) {
    objectType = "metro";
    targetPrefix = "Станция метро";
  } else if (/мвд|мфц|миграц|паспортн|паспортный/i.test(cleanedText)) {
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

  // City Match (+100)
  if (parsed.city && isMatchingCity(candidate, parsed.city)) {
    score += 100;
  }

  // Object Type Score Boosts
  if (parsed.objectType === "railway_station") {
    if (title.includes("железнодорожный вокзал") || title.includes("ж/д вокзал")) score += 80;
    else if (title.includes("вокзал")) score += 60;
  }

  return score;
}

export const hybridMapSearch = {
  parseLocationQuery,
  expandOrganizationQuery,

  async searchLocation(
    rawQuery: string
  ): Promise<{ results: MapSearchResult[]; isLowConfidence: boolean; message?: string }> {
    const originalQuery = rawQuery.trim();
    const expandedQuery = expandOrganizationQuery(originalQuery);
    
    // We pass the expanded query to the geocoding service which handles tiered attempts
    const rawResults = await geocodingService.searchAddress(expandedQuery || originalQuery);
    const parsed = parseLocationQuery(expandedQuery || originalQuery);

    if (rawResults.length === 0) {
      return {
        results: [],
        isLowConfidence: false,
        message: parsed.city ? `В городе (${parsed.city}) объект не найден.` : "По запросу ничего не найдено.",
      };
    }

    // Filter by city match if city was detected
    let filtered = rawResults;
    if (parsed.city) {
      const cityFiltered = rawResults.filter((item) => isMatchingCity(item, parsed.city!));
      if (cityFiltered.length > 0) {
        filtered = cityFiltered;
      }
    }

    // Score and Rank
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
      source: ((candidate as any).source as any) || "2gis",
    }));

    const hasExactCityMatch = parsed.city ? sortedResults.some((r) => r.cityMatch) : true;
    const isLowConfidence = !hasExactCityMatch || (sortedResults[0]?.score ?? 0) < 50;

    return {
      results: sortedResults,
      isLowConfidence,
      message: parsed.city && !hasExactCityMatch ? `В городе (${parsed.city}) точный объект не найден. Возможно вы имели в виду:` : undefined,
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