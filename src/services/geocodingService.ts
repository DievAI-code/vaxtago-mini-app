"use client";

import { getYandexKey } from "@/lib/env";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  type?: string;
  city?: string;
}

export interface GeocodingSearchResponse {
  results: GeocodingResult[];
  error?: string;
  isTooShort?: boolean;
}

/**
 * Очищает запрос от разговорных фраз.
 */
export function cleanQuery(text: string): string {
  if (!text) return "";
  let cleaned = text.toLowerCase().trim();
  const stopWords = [/^(найди|покажи|где|адрес)\s+/gi, /\s+(на карте|яндекс|поищи)$/gi];
  stopWords.forEach(regex => { cleaned = cleaned.replace(regex, ""); });
  return cleaned.trim();
}

export const geocodingService = {
  async searchAddressFull(rawQuery: string): Promise<GeocodingSearchResponse> {
    const query = cleanQuery(rawQuery);
    if (!query || query.length < 2) return { results: [], isTooShort: true };

    const apiKey = getYandexKey();
    if (!apiKey) return { results: [], error: "API ключ Яндекс Карт не настроен." };

    try {
      // Использование прямого HTTP Geocoder API
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(query)}&format=json&results=5&lang=ru_RU`;
      const response = await fetch(url);

      if (response.status === 403) {
        console.error("[Geocoder]: 403 Forbidden. Check API key permissions.");
        return { results: [], error: "Доступ к Яндекс Геокодеру запрещён. Проверьте настройки API-ключа." };
      }

      if (response.ok) {
        const data = await response.json();
        const members = data.response?.GeoObjectCollection?.featureMember || [];
        
        if (members.length > 0) {
          return {
            results: members.map((m: any) => {
              const obj = m.GeoObject;
              const [lng, lat] = obj.Point.pos.split(" ").map(Number);
              return {
                latitude: lat,
                longitude: lng,
                display_name: obj.metaDataProperty.GeocoderMetaData.text,
                name: obj.name,
                city: obj.description
              };
            })
          };
        }
      }
    } catch (e) {
      console.error("[Geocoding Service Error]", e);
    }

    return { results: [], error: "Объект не найден. Попробуйте уточнить название или город." };
  }
};