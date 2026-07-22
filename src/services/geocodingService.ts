"use client";

import { getYandexKey } from "@/lib/env";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  city?: string;
}

export const geocodingService = {
  /**
   * Поиск координат по адресу
   */
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    const apiKey = getYandexKey();
    if (!apiKey) {
      console.warn("Yandex Maps API key is missing.");
      return [];
    }

    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(query)}&format=json&results=5&lang=ru_RU`;
      const response = await fetch(url);

      if (response.status === 403) {
        throw new Error("YANDEX_403");
      }

      if (!response.ok) throw new Error("GEOCODE_ERROR");

      const data = await response.json();
      const members = data.response?.GeoObjectCollection?.featureMember || [];

      return members.map((m: any) => {
        const obj = m.GeoObject;
        const [lng, lat] = obj.Point.pos.split(" ").map(Number);
        return {
          latitude: lat,
          longitude: lng,
          display_name: obj.metaDataProperty.GeocoderMetaData.text,
          name: obj.name,
          city: obj.description
        };
      });
    } catch (error: any) {
      console.error("[GeocodingService]:", error.message);
      if (error.message === "YANDEX_403") {
        // Здесь можно добавить fallback на OpenStreetMap если нужно
      }
      return [];
    }
  },

  /**
   * Получение адреса по координатам
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const apiKey = getYandexKey();
    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${lng},${lat}&format=json&results=1`;
      const response = await fetch(url);
      const data = await response.json();
      return data.response?.GeoObjectCollection?.featureMember[0]?.GeoObject?.metaDataProperty?.GeocoderMetaData?.text || "";
    } catch {
      return "";
    }
  }
};