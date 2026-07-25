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

  // 1. Try 2GIS first (best for organizations)
  const gis2Results = await gis2Provider.search(resolvedQuery, city);
  if (gis2Results.length > 0) {
    return mapToResolvedPlace(gis2Results[0]);
  }

  // 2. Fallback to Yandex (better for addresses)
  const yandexResults = await yandexProvider.search(resolvedQuery, city);
  if (yandexResults.length > 0) {
    return mapToResolvedPlace(yandexResults[0]);
  }

  // 3. Fallback to raw query (without POI resolution)
  if (query !== resolvedQuery) {
    const rawGis2Results = await gis2Provider.search(query, city);
    if (rawGis2Results.length > 0) {
      return mapToResolvedPlace(rawGis2Results[0]);
    }
    const rawYandexResults = await yandexProvider.search(query, city);
    if (rawYandexResults.length > 0) {
      return mapToResolvedPlace(rawYandexResults[0]);
    }
  }

  // 4. Last resort: search with city appended directly to query
  if (city) {
    const combinedQuery = `${query} ${city}`;
    const combinedYandex = await yandexProvider.search(combinedQuery, undefined);
    if (combinedYandex.length > 0) {
      return mapToResolvedPlace(combinedYandex[0]);
    }
    const combinedGis2 = await gis2Provider.search(combinedQuery, undefined);
    if (combinedGis2.length > 0) {
      return mapToResolvedPlace(combinedGis2[0]);
    }
  }

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