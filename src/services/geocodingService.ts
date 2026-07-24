"use client";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  city?: string;
}

export const geocodingService = {
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&accept-language=ru`;
      const response = await fetch(osmUrl, {
        headers: { "User-Agent": "VAQTA-AI-Geocoder/1.0" }
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: any) => ({
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            display_name: item.display_name,
            name: item.name || query,
            city: item.address?.city || item.address?.town
          }));
        }
      }
    } catch (err: any) {
      console.error("[GeocodingService] Nominatim failed:", err?.message || err);
    }

    return [];
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
      error: results.length === 0 ? "К сожалению, объект не найден. Попробуйте изменить запрос." : null
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