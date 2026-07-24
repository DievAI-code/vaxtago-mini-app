"use client";

import { parseLocationQuery, ParsedLocationQuery } from "./maps/search";
import { searchPOI } from "./maps/poiSearch";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  address?: string;
  source?: "2gis" | "osm" | "overpass";
}

export const geocodingService = {
  /**
   * Primary search entrypoint that utilizes POI search with coordinates & Overpass fallback
   */
  async searchAddress(originalQuery: string): Promise<GeocodingResult[]> {
    const original = originalQuery.trim();
    if (!original) return [];

    const parsed = parseLocationQuery(original);

    // Perform coordinate & POI-based search with fallbacks
    const poiResults = await searchPOI({
      city: parsed.city,
      objectType: parsed.objectType,
      rawQuery: original,
    });

    return poiResults.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
      display_name: p.display_name,
      name: p.name,
      address: p.address,
      source: p.source,
    }));
  },

  async searchAddressFull(query: string) {
    if (query.trim().length < 2) {
      return {
        isTooShort: true,
        results: [],
        error: "Введите адрес",
      };
    }

    const results = await this.searchAddress(query);

    return {
      isTooShort: false,
      results,
      error: results.length === 0 ? "Объект не найден" : null,
    };
  },
};