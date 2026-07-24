"use client";

import { YANDEX_MAPS_KEY, YANDEX_GEOCODER_KEY, HAS_YANDEX_MAPS, HAS_YANDEX_GEOCODER } from "@/config/maps";

export interface YandexSearchResult {
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  type?: string;
  source: "yandex" | "openstreetmap";
}

export interface YandexRouteResult {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][]; 
  source: "yandex" | "osrm";
}

let yandexScriptPromise: Promise<void> | null = null;

/**
 * Очистка запроса от служебных слов
 */
function cleanQuery(text: string): string {
  const stopWords = [
    "покажи", "найди", "где находится", "на карте", 
    "маршрут", "открой", "адрес", "город", "в", "на"
  ];
  let cleaned = text.toLowerCase();
  stopWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    cleaned = cleaned.replace(regex, "");
  });
  return cleaned.replace(/\s+/g, " ").trim();
}

export const yandexService = {
  getMapsApiKey(): string {
    return YANDEX_MAPS_KEY;
  },

  getGeocoderApiKey(): string {
    return YANDEX_GEOCODER_KEY;
  },

  async loadYandexMaps(): Promise<boolean> {
    if (!HAS_YANDEX_MAPS) {
      console.warn("[Yandex] API Key missing. Skipping JS API load. Fallback to OSM.");
      return false;
    }

    if (window.ymaps3) return true;
    if (yandexScriptPromise) {
      try { await yandexScriptPromise; return true; } catch { return false; }
    }

    yandexScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(YANDEX_MAPS_KEY)}&lang=ru_RU`;
      script.async = true;
      script.onload = () => window.ymaps3?.ready.then(() => resolve()).catch(reject);
      script.onerror = () => reject(new Error("Network error loading Yandex Maps script"));
      document.head.appendChild(script);
    });

    try { await yandexScriptPromise; return true; } catch { return false; }
  },

  async geocode(query: string): Promise<YandexSearchResult[]> {
    const target = cleanQuery(query);
    if (!target) return [];

    if (HAS_YANDEX_GEOCODER) {
      try {
        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(YANDEX_GEOCODER_KEY)}&geocode=${encodeURIComponent(target)}&format=json&results=5&lang=ru_RU`;
        const res = await fetch(url);
        
        if (res.status === 403) {
          console.warn("[Yandex] Geocoder 403: Key limit or invalid service configuration.");
        } else if (res.ok) {
          const data = await res.json();
          const members = data.response?.GeoObjectCollection?.featureMember || [];
          if (members.length > 0) {
            return members.map((m: any) => {
              const obj = m.GeoObject;
              const [lng, lat] = obj.Point.pos.split(" ").map(Number);
              return {
                title: obj.name,
                address: obj.metaDataProperty?.GeocoderMetaData?.text || obj.name,
                latitude: lat,
                longitude: lng,
                source: "yandex",
              };
            });
          }
        }
      } catch (err) {
        console.warn("[Yandex] Geocoding failed, trying OSM...");
      }
    }

    // OSM Fallback
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(target)}&format=json&limit=5&accept-language=ru`);
      if (res.ok) {
        const data = await res.json();
        return data.map((item: any) => ({
          title: item.display_name.split(',')[0],
          address: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          source: "openstreetmap",
        }));
      }
    } catch {}

    return [];
  },

  async searchOrganization(query: string, city?: string): Promise<YandexSearchResult[]> {
    return this.geocode(city ? `${query} ${city}` : query);
  },

  async buildRoute(from: [number, number], to: [number, number], mode: "driving" | "foot" = "driving"): Promise<YandexRouteResult | null> {
    try {
      const profile = mode === "foot" ? "foot" : "car";
      const res = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`);
      if (res.ok) {
        const data = await res.json();
        const route = data.routes?.[0];
        if (route) {
          return {
            distanceMeters: route.distance,
            durationSeconds: route.duration,
            coordinates: route.geometry.coordinates,
            source: "osrm",
          };
        }
      }
    } catch {}
    return null;
  }
};