"use client";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  address?: string;
  source?: "yandex" | "2gis" | "osm";
}

export const geocodingService = {
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    if (!query.trim()) return [];

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&accept-language=ru`;
      const response = await fetch(url, {
        headers: { "User-Agent": "VAQTA-AI-Server/1.0 (contact: support@vaxtago.app)" },
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      return data.map((item: any) => ({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        display_name: item.display_name,
        name: item.name,
        address: item.display_name,
        source: "osm" as const,
      }));
    } catch (error) {
      console.error("Geocoding error:", error);
      return [];
    }
  },

  async fetchOSMProxy(query: string, viewbox?: string): Promise<GeocodingResult[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        addressdetails: "1",
        limit: "5",
        "accept-language": "ru",
      });

      if (viewbox) {
        params.append("viewbox", viewbox);
        params.append("bounded", "1");
      }

      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
      const response = await fetch(url, {
        headers: { "User-Agent": "VAQTA-AI-Server/1.0" },
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.map((item: any) => ({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        display_name: item.display_name,
        name: item.name,
        address: item.display_name,
        source: "osm" as const,
      }));
    } catch {
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