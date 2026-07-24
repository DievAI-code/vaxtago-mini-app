"use client";

import { searchEngine, SearchResult } from "./maps/searchEngine";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  address?: string;
  source?: "2gis" | "osm" | "overpass" | "alias";
  score?: number;
}

export const geocodingService = {
  async searchAddress(originalQuery: string, userCenter?: [number, number]): Promise<GeocodingResult[]> {
    const original = originalQuery.trim();
    if (!original) return [];

    // Use the new 2GIS-first search engine
    const results = await searchEngine.executeSearch(original, userCenter);

    if (results.length > 0) {
      return results.map(r => ({
        latitude: r.latitude,
        longitude: r.longitude,
        display_name: `${r.title}, ${r.address}`,
        name: r.title,
        address: r.address,
        source: "2gis",
        score: r.score
      }));
    }

    // Fallback logic could be added here if 2GIS finds absolutely nothing
    return [];
  },

  async searchAddressFull(query: string, userCenter?: [number, number]) {
    if (query.trim().length < 2) {
      return { isTooShort: true, results: [], error: "Введите адрес" };
    }

    const results = await this.searchAddress(query, userCenter);

    return {
      isTooShort: false,
      results,
      error: results.length === 0 ? "Объект не найден в базе 2ГИС" : null,
    };
  },
};