"use client";

import { getYandexGeocoderKey } from "@/lib/env";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  city?: string;
}

export const geocodingService = {
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    const apiKey = getYandexGeocoderKey();

    if (apiKey && apiKey.trim().length > 5) {
      try {
        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(query)}&format=json&results=5&lang=ru_RU`;
        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`[GeocodingService] Yandex Geocoder HTTP ${response.status}. Falling back to OpenStreetMap...`);
        } else {
          const data = await response.json();
          const members = data.response?.GeoObjectCollection?.featureMember || [];

          if (members.length > 0) {
            return members.map((m: any) => {
              const obj = m.GeoObject;
              const [lng, lat] = obj.Point.pos.split(" ").map(Number);
              return {
                latitude: lat,
                longitude: lng,
                display_name: obj.metaDataProperty?.GeocoderMetaData?.text || obj.name,
                name: obj.name,
                city: obj.description
              };
            });
          }
        }
      } catch (error: any) {
        console.warn("[GeocodingService] Yandex Geocode fetch error, switching to OpenStreetMap:", error?.message || error);
      }
    }

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
      console.error("[GeocodingService] Nominatim fallback failed:", err?.message || err);
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
    const apiKey = getYandexGeocoderKey();
    if (apiKey) {
      try {
        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${lng},${lat}&format=json&results=1&lang=ru_RU`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const addr = data.response?.GeoObjectCollection?.featureMember[0]?.GeoObject?.metaDataProperty?.GeocoderMetaData?.text;
          if (addr) return addr;
        }
      } catch {}
    }

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