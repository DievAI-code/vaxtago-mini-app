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
 * Cleans the query by removing search verbs and location keywords.
 * Example: "найди адрес жд вокзал тюмень на карте" -> "жд вокзал тюмень"
 */
export function cleanAddressQuery(query: string): string {
  if (!query) return "";

  let cleaned = query.trim();

  const stopWords = [
    /^(найди|покажи|поищи|где находится|где|адрес|местоположение)\s+/gi,
    /\s+(на карте|яндекс карте|покажи на карте|в яндексе)$/gi,
  ];

  for (const regex of stopWords) {
    cleaned = cleaned.replace(regex, "").trim();
  }

  // Remove common city prefixes for better geocoding
  cleaned = cleaned.replace(/\bг\.\s*/gi, "").replace(/\bгород\s+/gi, "");

  return cleaned || query.trim();
}

export const geocodingService = {
  async searchAddressFull(rawQuery: string): Promise<GeocodingSearchResponse> {
    const cleanQuery = cleanAddressQuery(rawQuery);

    if (!cleanQuery || cleanQuery.length < 2) {
      return {
        results: [],
        isTooShort: true,
        error: "Введите название объекта или адрес",
      };
    }

    const apiKey = getYandexKey();

    try {
      const yandexUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(
        apiKey
      )}&geocode=${encodeURIComponent(cleanQuery)}&format=json&lang=ru_RU&results=5`;

      const response = await fetch(yandexUrl);

      if (response.status === 403) {
        return {
          results: [],
          error: "Доступ к Яндекс Геокодеру запрещён. Проверьте настройки API-ключа.",
        };
      }

      if (!response.ok) throw new Error(`Yandex API status: ${response.status}`);

      const data = await response.json();
      const featureMembers = data?.response?.GeoObjectCollection?.featureMember || [];

      if (featureMembers.length > 0) {
        const results: GeocodingResult[] = featureMembers.map((item: any) => {
          const geo = item.GeoObject;
          const [lng, lat] = (geo.Point?.pos || "0 0").split(" ").map(Number);
          return {
            latitude: lat,
            longitude: lng,
            display_name: geo.metaDataProperty?.GeocoderMetaData?.text || geo.name || "",
            name: geo.name,
            city: geo.description || "",
          };
        });
        return { results };
      }
    } catch (err) {
      console.error("[Geocoding Error]:", err);
    }

    // Fallback to Nominatim if Yandex fails
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        cleanQuery
      )}&limit=3&accept-language=ru`;
      
      const response = await fetch(nominatimUrl, {
        headers: { "User-Agent": "VaxtaGo/3.0" }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return {
            results: data.map((p: any) => ({
              latitude: parseFloat(p.lat),
              longitude: parseFloat(p.lon),
              display_name: p.display_name,
              name: p.name || p.display_name.split(",")[0],
            })),
          };
        }
      }
    } catch (e) {
      console.warn("[Nominatim Fallback Error]:", e);
    }

    return {
      results: [],
      error: "Не удалось найти объект. Попробуйте уточнить название.",
    };
  },
};