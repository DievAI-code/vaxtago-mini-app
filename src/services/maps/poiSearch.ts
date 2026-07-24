"use client";

import { get2GISMapKey } from "@/lib/env";

export interface POISearchParams {
  city: string | null;
  objectType: string;
  rawQuery?: string;
}

export interface POIResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name: string;
  address: string;
  source: "2gis" | "overpass" | "osm";
}

export const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  Тюмень: { lat: 57.153, lon: 65.534 },
  Москва: { lat: 55.755, lon: 37.617 },
  Ташкент: { lat: 41.299, lon: 69.240 },
  "Санкт-Петербург": { lat: 59.934, lon: 30.335 },
  Казань: { lat: 55.830, lon: 49.066 },
  Екатеринбург: { lat: 56.838, lon: 60.605 },
  Новосибирск: { lat: 55.008, lon: 82.935 },
  Самарканд: { lat: 39.654, lon: 66.959 },
  Алматы: { lat: 43.238, lon: 76.882 },
  Сургут: { lat: 61.254, lon: 73.396 },
  Нижневартовск: { lat: 60.938, lon: 76.558 },
  Тобольск: { lat: 58.200, lon: 68.254 },
  Ишим: { lat: 56.111, lon: 69.489 },
};

/**
 * Calculates distance squared for proximity sorting
 */
function getDistanceSq(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2);
}

/**
 * Specialized 2GIS Catalog fetch for Organizations/Companies
 */
async function fetch2GISOrganization(
  query: string,
  center: { lat: number; lon: number } | null
): Promise<POIResult[]> {
  const key = get2GISMapKey();
  if (!key) return [];

  try {
    // Parameters requested: type=branch,company,building and specific fields
    let url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&key=${key}&type=branch,company,building&fields=items.point,items.name,items.full_name,items.address_name,items.contact_groups&limit=12`;

    if (center) {
      url += `&point=${center.lon},${center.lat}&radius=35000`;
    }

    console.log(`[2GIS ATTEMPT] Query: "${query}"`);

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    const items = data.result?.items || [];

    return items
      .map((item: any) => {
        const lat = item.point?.lat;
        const lon = item.point?.lon;
        if (lat && lon) {
          return {
            latitude: lat,
            longitude: lon,
            display_name: item.full_name || item.address_name || item.name,
            name: item.name || item.full_name || "Организация",
            address: item.address_name || item.full_name || "",
            source: "2gis" as const,
          };
        }
        return null;
      })
      .filter(Boolean) as POIResult[];
  } catch (e) {
    console.error("[2GIS Org Fetch Error]", e);
    return [];
  }
}

/**
 * Standard 2GIS Catalog fetch for Generic POIs
 */
async function fetch2GISPOI(
  query: string,
  center: { lat: number; lon: number } | null
): Promise<POIResult[]> {
  const key = get2GISMapKey();
  if (!key) return [];

  try {
    let url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&key=${key}&fields=items.geometry,items.full_name,items.address_name,items.name&limit=10`;
    if (center) url += `&point=${center.lon},${center.lat}&radius=20000`;

    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    const items = data.result?.items || [];

    return items
      .map((item: any) => {
        const lat = item.point?.lat;
        const lon = item.point?.lon;
        if (lat && lon) {
          return {
            latitude: lat,
            longitude: lon,
            display_name: item.full_name || item.address_name || item.name,
            name: item.name || item.full_name || "Объект",
            address: item.address_name || item.full_name || "",
            source: "2gis" as const,
          };
        }
        return null;
      })
      .filter(Boolean) as POIResult[];
  } catch (e) { return []; }
}

/**
 * OpenStreetMap Overpass API fallback
 */
async function fetchOverpassPOI(
  objectType: string,
  center: { lat: number; lon: number }
): Promise<POIResult[]> {
  try {
    let tagQuery = '["railway"="station"]';
    if (objectType === "bus_station") tagQuery = '["amenity"="bus_station"]';
    else if (objectType === "airport") tagQuery = '["aeroway"="aerodrome"]';
    else if (objectType === "hospital") tagQuery = '["amenity"="hospital"]';

    const overpassQl = `[out:json][timeout:10];(node(around:20000,${center.lat},${center.lon})${tagQuery};way(around:20000,${center.lat},${center.lon})${tagQuery};);out center;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQl)}`;

    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    const elements = data.elements || [];

    return elements
      .map((el: any) => {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        const name = el.tags?.name || el.tags?.["name:ru"] || "Объект";
        if (lat && lon) {
          return { latitude: lat, longitude: lon, display_name: name, name, address: name, source: "overpass" as const };
        }
        return null;
      })
      .filter(Boolean) as POIResult[];
  } catch (e) { return []; }
}

/**
 * Filter & Rank results: Prioritize city matches and proximity
 */
function filterAndRank(
  results: POIResult[],
  city: string | null,
  center: { lat: number; lon: number } | null
): POIResult[] {
  if (results.length === 0) return [];
  const cityLow = city?.toLowerCase() || "";

  return [...results].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    const textA = `${a.name} ${a.display_name} ${a.address}`.toLowerCase();
    const textB = `${b.name} ${b.display_name} ${b.address}`.toLowerCase();

    // 1. City Match Priority
    if (cityLow) {
      if (textA.includes(cityLow)) scoreA += 500;
      if (textB.includes(cityLow)) scoreB += 500;
    }

    // 2. Proximity Priority
    if (center) {
      const distA = getDistanceSq(a.latitude, a.longitude, center.lat, center.lon);
      const distB = getDistanceSq(b.latitude, b.longitude, center.lat, center.lon);
      scoreA -= distA * 1000;
      scoreB -= distB * 1000;
    }

    return scoreB - scoreA;
  });
}

/**
 * Main Entry Point
 */
export async function searchPOI({
  city,
  objectType,
  rawQuery,
}: POISearchParams): Promise<POIResult[]> {
  const original = rawQuery || "";
  const low = original.toLowerCase();
  const center = city ? CITY_COORDS[city] || null : null;

  // Determine Search Type
  const isOrganization = /епрс|предприятие|завод|ооо|ао|нпс|база|управление|цех|скважин/i.test(low);
  const typeLabel = isOrganization ? "organization" : objectType;

  console.log(`[ORG SEARCH]`);
  console.log(`Original: "${original}"`);
  console.log(`Type: ${typeLabel}`);
  console.log(`City: ${city || "Not detected"}`);
  console.log(`Center:`, center);

  if (isOrganization) {
    // Tiered Organization Search
    const attempts: string[] = [original];
    
    // Attempt 1: Full Name (Expanded) variant is usually already in original if expandedQuery was passed
    // We add some common logical variations
    if (city && original.includes(city)) {
       attempts.push(original.replace(city, "").trim()); // Attempt 1: Name without city
    }

    // Identify acronym if present (e.g. ЕПРС)
    const acronymMatch = low.match(/[а-яё]{2,6}/i);
    if (acronymMatch && !attempts.includes(acronymMatch[0])) {
       attempts.push(acronymMatch[0].toUpperCase()); // Attempt 2: Acronym
    }

    // Add city prefix variant
    if (city && !original.startsWith(city)) {
       attempts.push(`${city} ${original.replace(city, "").trim()}`); // Attempt 4: City + Name
    }

    for (const q of attempts) {
      const results = await fetch2GISOrganization(q, center);
      const filtered = filterAndRank(results, city, center);
      console.log(`Results for "${q}":`, filtered.length);
      if (filtered.length > 0) {
        console.log(`FINAL RESULT:`, filtered[0]);
        return filtered;
      }
    }

    return [];
  }

  // Standard Generic POI Search
  let results: POIResult[] = [];
  if (objectType === "railway_station") {
    const queries = city ? [`Железнодорожный вокзал ${city}`, "вокзал"] : ["вокзал"];
    for (const q of queries) {
      results = await fetch2GISPOI(q, center);
      if (results.length > 0) break;
    }
  } else {
    results = await fetch2GISPOI(original, center);
  }

  let finalResults = filterAndRank(results, city, center);

  // Overpass Fallback ONLY for generic POIs
  if (finalResults.length === 0 && center && !isOrganization) {
    const overpass = await fetchOverpassPOI(objectType, center);
    finalResults = filterAndRank(overpass, city, center);
    console.log(`OVERPASS RESULTS:`, finalResults.length);
  }

  console.log(`FINAL RESULT:`, finalResults[0] || "None");
  return finalResults;
}