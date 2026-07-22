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
  isRoute?: boolean;
  routePoints?: { origin: string; destination: string };
}

/**
 * Очищает запрос от разговорных фраз и стоп-слов.
 */
export function cleanQuery(text: string): string {
  if (!text) return "";
  let cleaned = text.toLowerCase().trim();

  const stopWords = [
    /^(найди|покажи|где находится|как добраться|как доехать|маршрут|адрес|на карте|яндекс карта|поищи)\s+/gi,
    /\s+(на карте|яндекс карте|покажи|найди)$/gi,
    /\bг\.\s*/gi,
    /\bгород\s+/gi
  ];

  stopWords.forEach(regex => {
    cleaned = cleaned.replace(regex, "");
  });

  return cleaned.trim();
}

/**
 * Пытается извлечь две точки для маршрута (из А в Б).
 */
export function extractRoutePoints(text: string): { origin: string; destination: string } | null {
  const low = text.toLowerCase();
  // Шаблоны: "из X в Y", "от X до Y"
  const routeMatch = low.match(/(?:из|от)\s+(.+?)\s+(?:в|до)\s+(.+)/i);
  
  if (routeMatch) {
    return {
      origin: cleanQuery(routeMatch[1]),
      destination: cleanQuery(routeMatch[2])
    };
  }
  return null;
}

export const geocodingService = {
  async searchAddressFull(rawQuery: string): Promise<GeocodingSearchResponse> {
    const route = extractRoutePoints(rawQuery);
    if (route) {
      return { results: [], isRoute: true, routePoints: route };
    }

    const query = cleanQuery(rawQuery);
    if (!query || query.length < 2) {
      return { results: [], isTooShort: true };
    }

    const apiKey = getYandexKey();

    // 1. Попытка через Яндекс
    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(query)}&format=json&results=5`;
      const response = await fetch(url);

      if (response.status === 403) {
        console.warn("[Yandex] 403 Forbidden: API key lacks Geocoder HTTP access.");
        // Не бросаем ошибку сразу, идем в Fallback
      } else if (response.ok) {
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
      console.error("[Yandex Error]", e);
    }

    // 2. Fallback: OpenStreetMap (Nominatim)
    // Используется если Яндекс выдал 403 или ошибка сети
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5`;
      const response = await fetch(osmUrl, { 
        headers: { "User-Agent": "VaxtaGo-App-v3" } 
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          return {
            results: data.map((p: any) => ({
              latitude: parseFloat(p.lat),
              longitude: parseFloat(p.lon),
              display_name: p.display_name,
              name: p.name || p.display_name.split(',')[0],
              type: p.type
            }))
          };
        }
      }
    } catch (e) {
      console.error("[OSM Fallback Error]", e);
    }

    return { 
      results: [], 
      error: apiKey ? "Объект не найден. Уточните город или название." : "Доступ к Яндекс Геокодеру запрещён. Проверьте настройки API-ключа." 
    };
  }
};