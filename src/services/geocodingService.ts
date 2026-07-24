"use client";

import { supabase } from "@/integrations/supabase/client";
import { parseLocationQuery } from "./maps/search";
import { searchPOI } from "./maps/poiSearch";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  address?: string;
  source?: "2gis" | "osm" | "overpass" | "alias";
}

export const geocodingService = {
  /**
   * Primary search entrypoint
   */
  async searchAddress(originalQuery: string): Promise<GeocodingResult[]> {
    const original = originalQuery.trim();
    if (!original) return [];

    const parsed = parseLocationQuery(original);

    // Perform coordinate & POI-based search with the refined hierarchy
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

  /**
   * Calls the Supabase Edge Function to proxy OSM Nominatim requests
   */
  async fetchOSMProxy(query: string, viewbox?: string): Promise<GeocodingResult[]> {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase.functions.invoke("osm-proxy", {
        body: { query, viewbox }
      });

      if (error || !data?.results) {
        console.warn("[Geocoding] OSM Proxy error:", error);
        return [];
      }

      return data.results.map((item: any) => ({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        display_name: item.display_name,
        name: item.name || item.display_name.split(",")[0],
        address: item.display_name,
        source: "osm" as const,
      }));
    } catch (err) {
      console.error("[Geocoding] Proxy exception:", err);
      return [];
    }
  },

  async searchAddressFull(query: string) {
    if (query.trim().length < 2) {
      return { isTooShort: true, results: [], error: "Введите адрес" };
    }

    const results = await this.searchAddress(query);

    return {
      isTooShort: false,
      results,
      error: results.length === 0 ? "Объект не найден" : null,
    };
  },
};