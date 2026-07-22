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
 * Очищает запрос от 'мусорных' слов для повышения точности поиска.
 */
export function cleanAddressQuery(query: string): string {
  if (!query) return "";

  let cleaned = query.toLowerCase().trim();

  const stopWords = [
    "найди", "покажи", "адрес", "где находится", "маршрут", "карта", 
    "яндекс карта", "на карте", "покажи на карте", "г.", "город"
  ];

  stopWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, "");
  });

  return cleaned.replace(/\s+/g, " ").trim();
}

/**
 * Определяет, является ли запрос организацией.
 */
function isOrganization(query: string): boolean {
  const orgKeywords = [
    "вокзал", "аэропорт", "завод", "магазин", "кафе", 
    "гостиница", "больница", "работодатель", "мвд", "мц"
  ];
  const low = query.toLowerCase();
  return orgKeywords.some(k => low.includes(k));
}

export const geocodingService = {
  async searchAddressFull(rawQuery: string): Promise<GeocodingSearchResponse> {
    const cleanQuery = cleanAddressQuery(rawQuery);
    
    if (!cleanQuery || cleanQuery.length < 3) {
      return { results: [], isTooShort: true };
    }

    const apiKey = getYandexKey();
    if (!apiKey) {
      return { results: [], error: "API ключ Яндекс Карт не настроен." };
    }

    const isOrg = isOrganization(cleanQuery);
    
    // В идеале здесь должен быть вызов Yandex Search API (Организации), 
    // но используем Геокодер с уточненным запросом.
    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(cleanQuery)}&format=json&results=5`;
      
      console.log("GEOLOCATION REQUEST", { original: rawQuery, cleaned: cleanQuery, isOrg });
      
      const response = await fetch(url);
      
      if (response.status === 403) {
        return { results: [], error: "Доступ к Яндекс Геокодеру запрещён. Проверьте настройки API-ключа." };
      }

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();
      const featureMembers = data.response?.GeoObjectCollection?.featureMember || [];

      if (featureMembers.length === 0) {
        return { results: [], error: "Не удалось найти объект. Попробуйте уточнить название или город." };
      }

      const results: GeocodingResult[] = featureMembers.map((item: any) => {
        const obj = item.GeoObject;
        const [lng, lat] = obj.Point.pos.split(" ").map(Number);
        return {
          latitude: lat,
          longitude: lng,
          display_name: obj.metaDataProperty.GeocoderMetaData.text,
          name: obj.name,
          city: obj.description
        };
      });

      return { results };
    } catch (err) {
      console.error("Geocoding failed", err);
      return { results: [], error: "Ошибка связи с сервисом карт." };
    }
  }
};