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
 * Calculates Euclidean distance squared between two points (for quick proximity sorting)
 */
function getDistanceSq(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat1 - lat2;
  const dLon = lon1 - lon2;
  return dLat * dLat + dLon * dLon;
}

/**
 * Fetches POI from 2GIS using Catalog API with point & radius query
 */
async function fetch2GISPOI(
  query: string,
  center: { lat: number; lon: number } | null
): Promise<POIResult[]> {
  const key = get2GISMapKey();
  if (!key) return [];

  try {
    let url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(
      query
    )}&key=${key}&fields=items.geometry,items.full_name,items.address_name,items.name&limit=10`;

    if (center) {
      // 2GIS takes point as lon,lat
      url += `&point=${center.lon},${center.lat}&radius=20000`;
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
    console.error("[2GIS POI Fetch Error]", e);
    return [];
  }
}

/**
 * Fallback: OpenStreetMap Overpass API (queries railway=station within city radius)
 */
async function fetchOverpassPOI(
  objectType: string,
  center: { lat: number; lon: number }
): Promise<POIResult[]> {
  try {
    let tagQuery = '["railway"="station"]';
    if (objectType === "bus_station") {
      tagQuery = '["amenity"="bus_station"]';
    } else if (objectType === "airport") {
      tagQuery = '["aeroway"="aerodrome"]';
    }

    const overpassQl = `[out:json][timeout:10];(node(around:20000,${center.lat},${center.lon})${tagQuery};way(around:20000,${center.lat},${center.lon})${tagQuery};);out center;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQl)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return [];

    const data = await response.json();
    const elements = data.elements || [];

    return elements
      .map((el: any) => {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        const name = el.tags?.name || el.tags?.["name:ru"] || el.tags?.["name:en"];

        if (lat && lon && name) {
          return {
            latitude: lat,
            longitude: lon,
            display_name: name,
            name,
            address: name,
            source: "overpass" as const,
          };
        }
        return null;
      })
      .filter(Boolean) as POIResult[];
  } catch (e) {
    console.error("[Overpass API Fetch Error]", e);
    return [];
  }
}

/**
 * Filter & Rank results:
 * 1. Exclude other cities (Тобольск, Ишим, Демьянка when city is Тюмень)
 * 2. Higher score if name contains "вокзал" or "железнодорожный"
 * 3. Proximity to city center coordinates
 */
function filterAndRankPOI(
  results: POIResult[],
  city: string | null,
  objectType: string,
  center: { lat: number; lon: number } | null
): POIResult[] {
  let filtered = results;

  if (city) {
    const cityLow = city.toLowerCase();
    filtered = filtered.filter((item) => {
      const text = `${item.name} ${item.display_name} ${item.address}`.toLowerCase();

      if (cityLow === "тюмень") {
        if (
          text.includes("тобольск") ||
          text.includes("ишим") ||
          text.includes("демьянка") ||
          text.includes("заводоуковск")
        ) {
          return false;
        }
      }
      return true;
    });
  }

  return [...filtered].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    if (objectType === "railway_station") {
      if (nameA.includes("железнодорожный вокзал") || nameA.includes("пассажирский вокзал")) scoreA += 100;
      else if (nameA.includes("вокзал")) scoreA += 70;

      if (nameB.includes("железнодорожный вокзал") || nameB.includes("пассажирский вокзал")) scoreB += 100;
      else if (nameB.includes("вокзал")) scoreB += 70;

      if (city && nameA.includes(city.toLowerCase())) scoreA += 50;
      if (city && nameB.includes(city.toLowerCase())) scoreB += 50;
    }

    if (center) {
      const distA = getDistanceSq(a.latitude, a.longitude, center.lat, center.lon);
      const distB = getDistanceSq(b.latitude, b.longitude, center.lat, center.lon);
      // Normalize distance penalty
      scoreA -= distA * 10;
      scoreB -= distB * 10;
    }

    return scoreB - scoreA;
  });
}

/**
 * Main POI Search entrypoint
 */
export async function searchPOI({
  city,
  objectType,
  rawQuery,
}: POISearchParams): Promise<POIResult[]> {
  const center = city ? CITY_COORDS[city] || null : null;

  console.log("CITY:", city);
  console.log("TYPE:", objectType);
  console.log("CENTER:", center);

  let raw2GisResults: POIResult[] = [];

  if (objectType === "railway_station") {
    // Attempt 1: Search by category / term around city center
    const queries = city
      ? [`Железнодорожный вокзал ${city}`, "железнодорожный вокзал", "вокзал"]
      : ["железнодорожный вокзал", "вокзал"];

    for (const q of queries) {
      raw2GisResults = await fetch2GISPOI(q, center);
      if (raw2GisResults.length > 0) break;
    }
  } else if (rawQuery) {
    raw2GisResults = await fetch2GISPOI(rawQuery, center);
  }

  console.log("2GIS RESULTS:", raw2GisResults);

  let filtered2Gis = filterAndRankPOI(raw2GisResults, city, objectType, center);

  if (filtered2Gis.length > 0) {
    console.log("OVERPASS RESULTS: [] (2GIS succeeded)");
    console.log("FINAL RESULT:", filtered2Gis[0]);
    return filtered2Gis;
  }

  // Fallback to Overpass API if 2GIS returns 0 results and center is available
  let overpassResults: POIResult[] = [];
  if (center) {
    overpassResults = await fetchOverpassPOI(objectType, center);
  }

  console.log("OVERPASS RESULTS:", overpassResults);

  const filteredOverpass = filterAndRankPOI(overpassResults, city, objectType, center);
  console.log("FINAL RESULT:", filteredOverpass[0] || null);

  return filteredOverpass;
}