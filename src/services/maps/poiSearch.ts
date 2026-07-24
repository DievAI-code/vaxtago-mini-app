OSM > Overpass) with specific retries for railway stations and organizations, and 30s Overpass timeout">
"use client";

import { get2GISMapKey } from "@/lib/env";
import { getOrganizationAlternatives } from "./organizationAliases";

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
 * Priority 1: 2GIS Catalog API (Specialized for Orgs)
 */
async function fetch2GIS(
  query: string,
  center: { lat: number; lon: number } | null,
  isOrg: boolean
): Promise<POIResult[]> {
  const key = get2GISMapKey();
  if (!key) return [];

  try {
    const fields = isOrg 
      ? "items.point,items.name,items.full_name,items.address_name,items.contact_groups"
      : "items.point,items.name,items.full_name,items.address_name";
    
    const type = isOrg ? "branch,company,building" : "branch,building,attraction,airport,terminal";

    let url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&key=${key}&type=${type}&fields=${fields}&limit=12`;

    if (center) {
      url += `&point=${center.lon},${center.lat}&radius=35000`;
    }

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
  } catch (e) {
    return [];
  }
}

/**
 * Priority 2: OpenStreetMap Nominatim
 */
async function fetchOSMNominatim(query: string, center: { lat: number; lon: number } | null): Promise<POIResult[]> {
  try {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&accept-language=ru`;
    if (center) {
      // Focus search near coordinates
      const viewbox = `${center.lon - 0.5},${center.lat + 0.5},${center.lon + 0.5},${center.lat - 0.5}`;
      url += `&viewbox=${viewbox}&bounded=1`;
    }

    const response = await fetch(url, { headers: { "User-Agent": "VAQTA-AI/1.0" } });
    if (!response.ok) return [];
    const data = await response.json();

    return data.map((item: any) => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      display_name: item.display_name,
      name: item.name || item.display_name.split(",")[0],
      address: item.display_name,
      source: "osm" as const,
    }));
  } catch {
    return [];
  }
}

/**
 * Priority 3: Overpass API Fallback (Strictly for non-orgs)
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
    else if (objectType === "metro") tagQuery = '["railway"="station"]["station"="subway"]';

    const overpassQl = `[out:json][timeout:30];(node(around:20000,${center.lat},${center.lon})${tagQuery};way(around:20000,${center.lat},${center.lon})${tagQuery};);out center;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQl)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

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
  } catch {
    return []; // Silence 504 and errors
  }
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

  const isOrganization = /епрс|ермако|предприятие|завод|ооо|ао|нпс|база|управление|цех|скважин|прс/i.test(low);
  const typeLabel = isOrganization ? "organization" : objectType;

  // Build Tiered Attempts
  let attempts: string[] = [];
  if (typeLabel === "railway_station" && city) {
    attempts = [
      `вокзал ${city}`,
      `железнодорожный вокзал ${city}`,
      `${city} вокзал`,
      `станция ${city}`
    ];
  } else if (isOrganization) {
    attempts = getOrganizationAlternatives(original, city);
  } else {
    attempts = [original];
  }

  console.log(`[POI SEARCH]`);
  console.log(`TYPE: ${typeLabel}`);
  console.log(`QUERY: ${original}`);
  console.log(`ALTERNATIVES:`, attempts);

  let finalResults: POIResult[] = [];

  // TIER 1: 2GIS (With retries for alternatives)
  for (const q of attempts) {
    console.log(`CURRENT ATTEMPT: 2GIS "${q}"`);
    const results = await fetch2GIS(q, center, isOrganization);
    finalResults = filterAndRank(results, city, center);
    console.log(`RESULT COUNT: ${finalResults.length}`);
    if (finalResults.length > 0) return finalResults;
  }

  // TIER 2: OSM Nominatim (Only if 2GIS failed all attempts)
  for (const q of attempts) {
    console.log(`CURRENT ATTEMPT: Nominatim "${q}"`);
    const results = await fetchOSMNominatim(q, center);
    finalResults = filterAndRank(results, city, center);
    console.log(`RESULT COUNT: ${finalResults.length}`);
    if (finalResults.length > 0) return finalResults;
  }

  // TIER 3: Overpass (Last resort, only for non-orgs)
  if (!isOrganization && center) {
    console.log(`CURRENT ATTEMPT: Overpass API (30s timeout)`);
    const results = await fetchOverpassPOI(objectType, center);
    finalResults = filterAndRank(results, city, center);
    console.log(`RESULT COUNT: ${finalResults.length}`);
    if (finalResults.length > 0) return finalResults;
  }

  return [];
}