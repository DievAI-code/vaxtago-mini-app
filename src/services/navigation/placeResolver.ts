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

  // 3. Fallback to raw query
  if (query.trim()) {
    const rawResults = await yandexProvider.search(query, city);
    if (rawResults.length > 0) {
      return mapToResolvedPlace(rawResults[0]);
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