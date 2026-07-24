"use client";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  address?: string;
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function swapWords(query: string): string {
  const words = query.split(" ");
  if (words.length === 2) {
    return `${words[1]} ${words[0]}`;
  }
  return query;
}

async function fetch2GIS(query: string): Promise<GeocodingResult[]> {
  const key = import.meta.env.VITE_2GIS_MAP_KEY;
  if (!key) return [];

  try {
    const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&key=${key}&fields=items.geometry,items.full_name,items.address_name,items.name&limit=5`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.result?.items) {
        const results: GeocodingResult[] = [];
        for (const item of data.result.items) {
          const selection = item.geometry?.selection;
          if (selection) {
            const match = selection.match(/POINT\(([\d.]+) ([\d.]+)\)/);
            if (match) {
              const lon = parseFloat(match[1]);
              const lat = parseFloat(match[2]);
              results.push({
                latitude: lat,
                longitude: lon,
                display_name: item.full_name || item.name || item.address_name || query,
                name: item.name || query,
                address: item.full_name || item.address_name || "",
              });
            }
          }
        }
        return results;
      }
    }
  } catch (err: any) {
    console.error("[GeocodingService] 2GIS failed:", err?.message || err);
  }
  return [];
}

async function fetchNominatim(query: string): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    format: "json",
    q: query,
    "accept-language": "ru",
    limit: "5",
    addressdetails: "1",
  });

  const url = `${NOMINATIM_BASE}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "VAQTA-AI-Geocoder/1.0" },
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
  } catch (err: any) {
    console.error("[GeocodingService] Nominatim failed:", err?.message || err);
  }

  return [];
}

export const geocodingService = {
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    const normalized = normalizeQuery(query);
    if (!normalized) return [];

    // 1. Try 2GIS Catalog API
    let results = await fetch2GIS(normalized);

    // 2. Fallback to Nominatim if 2GIS fails or returns nothing
    if (results.length === 0) {
      results = await fetchNominatim(normalized);
    }

    // 3. Fallback with swapped words for Russian language (e.g., "вокзал тюмень" -> "тюмень вокзал")
    if (results.length === 0) {
      const swapped = swapWords(normalized);
      if (swapped !== normalized) {
        results = await fetchNominatim(swapped);
      }
    }

    return results;
  },

  async searchAddressFull(query: string): Promise<{ isTooShort: boolean; results: GeocodingResult[]; error: string | null }> {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      return { isTooShort: true, results: [], error: "Введите полный адрес:\nгород + улица + дом" };
    }

    const results = await this.searchAddress(trimmed);
    return {
      isTooShort: false,
      results,
      error: results.length === 0 ? "Объект не найден. Попробуйте написать город и объект подробнее." : null,
    };
  },

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    // Try 2GIS reverse geocoding
    try {
      const key = import.meta.env.VITE_2GIS_MAP_KEY;
      if (key) {
        const url = `https://catalog.api.2gis.com/3.0/items/geocode?lon=${lng}&lat=${lat}&key=${key}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.result?.items?.[0]) {
            return data.result.items[0].full_name || data.result.items[0].name || "";
          }
        }
      }
    } catch {}

    // Fallback to Nominatim reverse geocoding
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`;
      const response = await fetch(osmUrl, {
        headers: { "User-Agent": "VAQTA-AI-Geocoding/1.0" }
      });
      if (response.ok) {
        const data = await response.json();
        return data.display_name || "";
      }
    } catch {}

    return "";
  }
};