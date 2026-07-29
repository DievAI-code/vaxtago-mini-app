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

/**
 * Ищет ОДИН объект (FROM или TO).
 * Поиск выполняется отдельным запросом "объект + город" —
 * НИКОГДА не ищет всю строку запроса целиком.
 * Порядок: Yandex Search API → 2GIS Places API (fallback).
 */
export async function resolvePlace(
  query: string,
  city?: string
): Promise<ResolvedPlace | null> {
  if (!query || !query.trim()) return null;

  const resolvedQuery = resolvePOI(query, city);
  console.log(`[NAV DEBUG] POI resolve: "${query}" → "${resolvedQuery}" (city: ${city || "—"})`);

  // 1. Yandex Search API — первичный поиск
  const yandexResults = await yandexProvider.search(resolvedQuery, city);
  console.log(`[NAV DEBUG] Yandex Result "${resolvedQuery}${city ? " " + city : ""}": ${yandexResults.length} item(s)`);
  if (yandexResults.length > 0) {
    return mapToResolvedPlace(yandexResults[0]);
  }

  // 2. 2GIS Places API — fallback, если Yandex не нашёл
  const gis2Results = await gis2Provider.search(resolvedQuery, city);
  console.log(`[NAV DEBUG] 2GIS Result "${resolvedQuery}${city ? " " + city : ""}": ${gis2Results.length} item(s)`);
  if (gis2Results.length > 0) {
    return mapToResolvedPlace(gis2Results[0]);
  }

  // 3. Fallback — исходный запрос без POI-расширения
  if (query !== resolvedQuery) {
    const rawYandex = await yandexProvider.search(query, city);
    console.log(`[NAV DEBUG] Yandex Result (raw) "${query}": ${rawYandex.length} item(s)`);
    if (rawYandex.length > 0) return mapToResolvedPlace(rawYandex[0]);

    const rawGis2 = await gis2Provider.search(query, city);
    console.log(`[NAV DEBUG] 2GIS Result (raw) "${query}": ${rawGis2.length} item(s)`);
    if (rawGis2.length > 0) return mapToResolvedPlace(rawGis2[0]);
  }

  // 4. Fallback — явная склейка "объект город"
  if (city) {
    const combinedQuery = `${query} ${city}`;
    const combinedYandex = await yandexProvider.search(combinedQuery, undefined);
    console.log(`[NAV DEBUG] Yandex Result (combined) "${combinedQuery}": ${combinedYandex.length} item(s)`);
    if (combinedYandex.length > 0) return mapToResolvedPlace(combinedYandex[0]);

    const combinedGis2 = await gis2Provider.search(combinedQuery, undefined);
    console.log(`[NAV DEBUG] 2GIS Result (combined) "${combinedQuery}": ${combinedGis2.length} item(s)`);
    if (combinedGis2.length > 0) return mapToResolvedPlace(combinedGis2[0]);
  }

  console.warn(`[NAV DEBUG] NOT FOUND: "${query}" (city: ${city || "—"})`);
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