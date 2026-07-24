"use client";

import { yandexService, YandexSearchResult, YandexRouteResult } from "./yandex";

export type MapSearchResult = YandexSearchResult;
export type RouteDetail = YandexRouteResult;

export interface RouteOptions {
  from: [number, number]; // [lat, lng]
  to: [number, number];   // [lat, lng]
  mode?: "driving" | "foot";
}

export const hybridMapSearch = {
  async searchLocation(query: string): Promise<MapSearchResult[]> {
    return yandexService.geocode(query);
  },

  async searchOrganization(query: string, city?: string): Promise<MapSearchResult[]> {
    return yandexService.searchOrganization(query, city);
  },

  async searchAddress(address: string): Promise<MapSearchResult | null> {
    const results = await yandexService.geocode(address);
    return results.length > 0 ? results[0] : null;
  },

  async buildRoute({ from, to, mode = "driving" }: RouteOptions): Promise<RouteDetail | null> {
    return yandexService.buildRoute(from, to, mode);
  },
};