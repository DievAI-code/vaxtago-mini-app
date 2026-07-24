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

    // 1. Original query
    let results = await fetchNominatim(normalized);

    // 2. Fallback: swap words if 2 words (e.g., "вокзал тюмень" -> "тюмень вокзал")
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