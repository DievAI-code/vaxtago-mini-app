"use client";

import { get2GISMapKey } from "@/lib/env";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  address?: string;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

async function fetch2GISCatalog(query: string): Promise<GeocodingResult[]> {
  const key = get2GISMapKey();
  if (!key) return [];

  try {
    const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&key=${key}&fields=items.geometry,items.full_name,items.address_name,items.name&limit=10`;
    if (import.meta.env.DEV) {
      console.log(`[2GIS Search API Request] URL: ${url}`);
    }

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[2GIS Search API] HTTP Error ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (import.meta.env.DEV) {
      console.log(`[2GIS Search API Response] Items count: ${data.result?.items?.length || 0}`);
    }

    if (data.result?.items) {
      const results: GeocodingResult[] = [];
      for (const item of data.result.items) {
        let lat: number | null = null;
        let lon: number | null = null;

        if (item.point) {
          lat = item.point.lat;
          lon = item.point.lon;
        } else if (item.geometry?.selection) {
          const match = item.geometry.selection.match(/POINT\(([\d.]+) ([\d.]+)\)/);
          if (match) {
            lon = parseFloat(match[1]);
            lat = parseFloat(match[2]);
          }
        }

        if (lat !== null && lon !== null) {
          results.push({
            latitude: lat,
            longitude: lon,
            display_name: item.full_name || item.address_name || item.name || query,
            name: item.name || item.address_name || query,
            address: item.full_name || item.address_name || "",
          });
        }
      }
      return results;
    }
  } catch (err: any) {
    console.error("[GeocodingService] 2GIS request failed:", err?.message || err);
  }
  return [];
}

async function fetchNominatimFallback(query: string): Promise<GeocodingResult[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=10&addressdetails=1&accept-language=ru`;
    const response = await fetch(url, {
      headers: { "User-Agent": "VAQTA-AI-Search/1.0" },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          display_name: item.display_name,
          name: item.name || query,
          address: item.display_name,
        }));
      }
    }
  } catch {}
  return [];
}

export const geocodingService = {
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    const normalized = normalizeQuery(query);
    if (!normalized) return [];

    // 1. Try 2GIS Catalog API 3.0
    let results = await fetch2GISCatalog(normalized);

    // 2. Fallback to Nominatim if 2GIS returns nothing (for international locations like Tashkent, Samarkand)
    if (results.length === 0) {
      results = await fetchNominatimFallback(normalized);
    }

    return results;
  },

  async searchAddressFull(query: string): Promise<{ isTooShort: boolean; results: GeocodingResult[]; error: string | null }> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return { isTooShort: true, results: [], error: "Пожалуйста, введите название места или адрес." };
    }

    const results = await this.searchAddress(trimmed);
    return {
      isTooShort: false,
      results,
      error: results.length === 0 ? "По запросу ничего не найдено." : null,
    };
  },
};