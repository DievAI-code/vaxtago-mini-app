"use client";

import { MapLocation } from "@/services/maps/types";
import { gis2Provider } from "@/services/maps/providers/gis2Provider";
import { yandexProvider } from "@/services/maps/providers/yandexProvider";
import { resolvePOI } from "@/services/maps/poiDictionary";

export interface ResolvedPlace {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  rating?: number;
  hours?: string;
  category?: string;
  source: "2gis" | "yandex" | "osm";
}

export async function resolvePlace(
  query: string,
  city?: string
): Promise<ResolvedPlace | null> {
  if (!query || !query.trim()) return null;
  
  const resolvedQuery = resolvePOI(query, city);
  console.log(`[VAQTA ROUTE] Resolving place: query="${query}", resolved="${resolvedQuery}", city="${city || "none"}"`);

  // 1. Try 2GIS first (best for organizations)
  console.log(`[VAQTA ROUTE] Trying 2GIS for: "${resolvedQuery}"`);
  const gis2Results = await gis2Provider.search(resolvedQuery, city);
  if (gis2Results.length > 0) {
    console.log(`[VAQTA ROUTE] Found via 2GIS:`, gis2Results[0].name);
    return mapToResolvedPlace(gis2Results[0]);
  }

  // 2. Fallback to Yandex (better for addresses)
  console.log(`[VAQTA ROUTE] Trying Yandex for: "${resolvedQuery}"`);
  const yandexResults = await yandexProvider.search(resolvedQuery, city);
  if (yandexResults.length > 0) {
    console.log(`[VAQTA ROUTE] Found via Yandex:`, yandexResults[0].name);
    return mapToResolvedPlace(yandexResults[0]);
  }

  // 3. Fallback to raw query (without POI resolution)
  if (query !== resolvedQuery) {
    console.log(`[VAQTA ROUTE] Trying raw query: "${query}"`);
    const rawGis2Results = await gis2Provider.search(query, city);
    if (rawGis2Results.length > 0) {
      console.log(`[VAQTA ROUTE] Found via 2GIS (raw):`, rawGis2Results[0].name);
      return mapToResolvedPlace(rawGis2Results[0]);
    }
    const rawYandexResults = await yandexProvider.search(query, city);
    if (rawYandexResults.length > 0) {
      console.log(`[VAQTA ROUTE] Found via Yandex (raw):`, rawYandexResults[0].name);
      return mapToResolvedPlace(rawYandexResults[0]);
    }
  }

  // 4. Last resort: search with city appended directly to query
  if (city) {
    const combinedQuery = `${query} ${city}`;
    console.log(`[VAQTA ROUTE] Trying combined query: "${combinedQuery}"`);
    const combinedYandex = await yandexProvider.search(combinedQuery, undefined);
    if (combinedYandex.length > 0) {
      console.log(`[VAQTA ROUTE] Found via Yandex (combined):`, combinedYandex[0].name);
      return mapToResolvedPlace(combinedYandex[0]);
    }
    const combinedGis2 = await gis2Provider.search(combinedQuery, undefined);
    if (combinedGis2.length > 0) {
      console.log(`[VAQTA ROUTE] Found via 2GIS (combined):`, combinedGis2[0].name);
      return mapToResolvedPlace(combinedGis2[0]);
    }
  }

  console.warn(`[VAQTA ROUTE] Place not found: "${query}" in "${city || "any"}"`);
  return null;
}

export async function resolveMultiplePlaces(
  queries: string[],
  city?: string
): Promise<(ResolvedPlace | null)[]> {
  return Promise.all(queries.map((q) => resolvePlace(q, city)));
}

function mapToResolvedPlace(loc: MapLocation): ResolvedPlace {
  return {
    name: loc.name,
    address: loc.address,
    latitude: loc.latitude,
    longitude: loc.longitude,
    phone: loc.phone,
    rating: loc.rating,
    hours: loc.hours,
    category: loc.category,
    source: loc.source,
  };
}