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

const ORG_KEYWORDS = [
  "вокзал", "аэропорт", "магазин", "завод", "больница", "гостиница",
  "работодатель", "кафе", "организация", "мвд", "мц", "сахарово",
  "автовокзал", "рынок", "отель", "предприятие", "станция", "метро"
];

export function cleanAddressQuery(query: string): string {
  if (!query) return "";
  let cleaned = query.trim();
  const prefixes = [
    /^(найди адрес|покажи адрес|где находится|найти место|покажи на карте|маршрут до|покажи место|покажи|найди|где|адрес|маршрут|как доехать|поищи)\s+/gi,
    /^(кўрсат|манзил|жой)\s+/gi,
  ];
  for (const prefix of prefixes) { cleaned = cleaned.replace(prefix, "").trim(); }
  cleaned = cleaned.replace(/(?:покажи|найди|где находится)\s+(?:адрес|место)/gi, "").trim();
  cleaned = cleaned.replace(/\bг\.\s*/gi, " ").replace(/\bгород\s+/gi, " ");
  cleaned = cleaned
    .replace(/\bтюмени\b/gi, "Тюмень")
    .replace(/\bмосквы\b/gi, "Москва")
    .replace(/\bпетербурга\b/gi, "Санкт-Петербург")
    .replace(/\bташкента\b/gi, "Ташкент");
  return cleaned.replace(/\s+/g, " ").trim();
}

function isResultRelevant(cleanQuery: string, result: GeocodingResult): boolean {
  const queryLow = cleanQuery.toLowerCase();
  const resLow = (result.display_name + " " + (result.name || "")).toLowerCase();
  if (queryLow.includes("вокзал") && !resLow.includes("вокзал") && !resLow.includes("станция")) return false;
  if (queryLow.includes("аэропорт") && !resLow.includes("аэропорт") && !resLow.includes("рощино")) return false;
  return true;
}

export const geocodingService = {
  async searchAddressFull(rawQuery: string): Promise<GeocodingSearchResponse> {
    const cleanQuery = cleanAddressQuery(rawQuery);
    if (!cleanQuery || cleanQuery.length < 2) {
      return { results: [], isTooShort: true, error: "Уточните название или город." };
    }

    const apiKey = getYandexKey();
    const isOrg = ORG_KEYWORDS.some(kw => cleanQuery.toLowerCase().includes(kw));

    // 1. Try Yandex Geocoder
    try {
      const yandexUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(apiKey)}&geocode=${encodeURIComponent(cleanQuery)}&format=json&lang=ru_RU&results=5`;
      const response = await fetch(yandexUrl);

      if (response.status === 403) {
        console.warn("[Yandex Geocoder 403]: Access restricted. Falling back to OpenStreetMap.");
      } else if (response.ok) {
        const data = await response.json();
        const featureMembers = data?.response?.GeoObjectCollection?.featureMember || [];
        if (featureMembers.length > 0) {
          const results: GeocodingResult[] = featureMembers.map((item: any) => {
            const geo = item.GeoObject;
            const [lng, lat] = (geo.Point?.pos || "0 0").split(" ").map(Number);
            const text = geo.metaDataProperty?.GeocoderMetaData?.text || geo.name || "";
            return { latitude: lat, longitude: lng, display_name: text, name: geo.name, city: geo.description || "" };
          }).filter((res: any) => !isOrg || isResultRelevant(cleanQuery, res));

          if (results.length > 0) return { results };
        }
      }
    } catch (err) {
      console.warn("[Yandex Geocoder Error]:", err);
    }

    // 2. Fallback to Nominatim
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(cleanQuery)}&limit=5&addressdetails=1&accept-language=ru`;
      const response = await fetch(nominatimUrl, { headers: { "User-Agent": "VaxtaGo/3.0" } });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const results: GeocodingResult[] = data.map((place: any) => ({
            latitude: parseFloat(place.lat),
            longitude: parseFloat(place.lon),
            display_name: place.display_name,
            name: place.name || place.display_name.split(",")[0],
            city: place.address?.city || ""
          })).filter((res: any) => !isOrg || isResultRelevant(cleanQuery, res));
          if (results.length > 0) return { results };
        }
      }
    } catch (err) {
      console.error("[Nominatim Error]:", err);
    }

    return { results: [], error: "Не удалось найти объект. Попробуйте уточнить название или город." };
  }
};