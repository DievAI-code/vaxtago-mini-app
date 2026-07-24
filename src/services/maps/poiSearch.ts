"use client";

import { get2GISMapKey } from "@/lib/env";
import { getOrganizationAlternatives } from "./organizationAliases";
import { mapAliasService } from "../mapAliasService";
import { geocodingService } from "../geocodingService";

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
  source: "2gis" | "overpass" | "osm" | "alias";
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
 * Priority 2: 2GIS Catalog API
 */
async function fetch2GIS(query: string, center: { lat: number; lon: number } | null, isOrg: boolean): Promise<POIResult[]> {
  const key = get2GISMapKey();
  if (!key) return [];
  try {
    const fields = isOrg ? "items.point,items.name,items.full_name,items.address_name,items.contact_groups" : "items.point,items.name,items.full_name,items.address_name";
    const type = isOrg ? "branch,company,building" : "branch,building,attraction,airport,terminal";
    let url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&key=${key}&type=${type}&fields=${fields}&limit=12`;
    if (center) url += `&point=${center.lon},${center.lat}&radius=35000`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    const items = data.result?.items || [];
    return items.map((item: any) => ({
      latitude: item.point?.lat,
      longitude: item.point?.lon,
      display_name: item.full_name || item.address_name || item.name,
      name: item.name || item.full_name || "Объект",
      address: item.address_name || item.full_name || "",
      source: "2gis" as const,
    })).filter((i: any) => i.latitude && i.longitude) as POIResult[];
  } catch { return []; }
}

/**
 * Priority 4: Overpass API Fallback
 */
async function fetchOverpassPOI(objectType: string, center: { lat: number; lon: number }): Promise<POIResult[]> {
  try {
    let tagQuery = '["railway"="station"]';
    if (objectType === "bus_station") tagQuery = '["amenity"="bus_station"]';
    else if (objectType === "airport") tagQuery = '["aeroway"="aerodrome"]';
    else if (objectType === "hospital") tagQuery = '["amenity"="hospital"]';
    else if (objectType === "metro") tagQuery = '["railway"="station"]["station"="subway"]';

    const overpassQl = `[out:json][timeout:30];(node(around:20000,${center.lat},${center.lon})${tagQuery};way(around:20000,${center.lat},${center.lon})${tagQuery};);out center;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQl)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.elements || []).map((el: any) => {
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      const name = el.tags?.name || el.tags?.["name:ru"] || "Объект";
      if (lat && lon) return { latitude: lat, longitude: lon, display_name: name, name, address: name, source: "overpass" as const };
      return null;
    }).filter(Boolean) as POIResult[];
  } catch { return []; }
}

function filterAndRank(results: POIResult[], city: string | null, center: { lat: number; lon: number } | null): POIResult[] {
  if (results.length === 0) return [];
  const cityLow = city?.toLowerCase() || "";
  return [...results].sort((a, b) => {
    let scoreA = a.source === "alias" ? 1000 : 0;
    let scoreB = b.source === "alias" ? 1000 : 0;
    const textA = `${a.name} ${a.display_name}`.toLowerCase();
    const textB = `${b.name} ${b.display_name}`.toLowerCase();
    if (cityLow) {
      if (textA.includes(cityLow)) scoreA += 500;
      if (textB.includes(cityLow)) scoreB += 500;
    }
    if (center) {
      scoreA -= (Math.pow(a.latitude - center.lat, 2) + Math.pow(a.longitude - center.lon, 2)) * 1000;
      scoreB -= (Math.pow(b.latitude - center.lat, 2) + Math.pow(b.longitude - center.lon, 2)) * 1000;
    }
    return scoreB - scoreA;
  });
}

/**
 * Main Entry Point
 */
export async function searchPOI({ city, objectType, rawQuery }: POISearchParams): Promise<POIResult[]> {
  const original = rawQuery || "";
  const low = original.toLowerCase();
  const center = city ? CITY_COORDS[city] || null : null;

  console.log(`[SEARCH PIPELINE] START Query: "${original}"`);

  // STEP 1: map_aliases Supabase (Tier 0)
  const aliasMatches = await mapAliasService.searchMapAlias(original);
  if (aliasMatches.length > 0) {
    console.log(`[SEARCH PIPELINE] STEP: 1 | SOURCE: map_aliases | RESULTS: ${aliasMatches.length} | STOP: TRUE`);
    const aliasResults: POIResult[] = aliasMatches.map(a => ({
      latitude: Number(a.latitude || 0),
      longitude: Number(a.longitude || 0),
      display_name: a.title + (a.city ? `, ${a.city}` : ""),
      name: a.title,
      address: a.city || "",
      source: "alias" as const
    }));
    return filterAndRank(aliasResults, city, center);
  }

  const isOrganization = /епрс|ермако|предприятие|завод|ооо|ао|нпс|база|управление|цех|скважин|прс/i.test(low);
  const attempts = isOrganization ? getOrganizationAlternatives(original, city) : [original];

  // STEP 2: 2GIS Catalog API (Tier 1)
  let results2GIS: POIResult[] = [];
  for (const q of attempts) {
    const results = await fetch2GIS(q, center, isOrganization);
    if (results.length > 0) {
      results2GIS = results;
      break;
    }
  }
  
  if (results2GIS.length > 0) {
    console.log(`[SEARCH PIPELINE] STEP: 2 | SOURCE: 2gis | RESULTS: ${results2GIS.length}`);
    return filterAndRank(results2GIS, city, center);
  }

  // STEP 3: Supabase osm-proxy (Tier 2)
  let viewbox: string | undefined;
  if (center) {
    viewbox = `${center.lon - 0.5},${center.lat + 0.5},${center.lon + 0.5},${center.lat - 0.5}`;
  }

  const resultsOSM = await geocodingService.fetchOSMProxy(original, viewbox);
  if (resultsOSM.length > 0) {
    console.log(`[SEARCH PIPELINE] STEP: 3 | SOURCE: osm-proxy | RESULTS: ${resultsOSM.length}`);
    const adaptedOSM = resultsOSM as any as POIResult[];
    return filterAndRank(adaptedOSM, city, center);
  }

  // STEP 4: Overpass (Tier 3)
  if (!isOrganization && center) {
    const resultsOverpass = await fetchOverpassPOI(objectType, center);
    if (resultsOverpass.length > 0) {
      console.log(`[SEARCH PIPELINE] STEP: 4 | SOURCE: overpass | RESULTS: ${resultsOverpass.length}`);
      return filterAndRank(resultsOverpass, city, center);
    }
  }

  console.log(`[SEARCH PIPELINE] FINISHED | NO RESULTS`);
  return [];
}