"use client";

import { mapProvider } from "./mapProvider";

export interface MapSearchResult {
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  type?: string;
  source: "yandex" | "openstreetmap";
}

export interface RouteOptions {
  from: [number, number]; // [lat, lng]
  to: [number, number];   // [lat, lng]
  mode?: "driving" | "foot";
}

export interface RouteDetail {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][]; // [lng, lat]
  source: "yandex" | "osrm";
}

export const hybridMapSearch = {
  /**
   * Поиск локации с автоматическим фоллбэком Yandex -> Nominatim
   */
  async searchLocation(query: string): Promise<MapSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // 1. Попытка запроса через Yandex Geocoder (если ключ доступен)
    if (mapProvider.isYandexAvailable()) {
      try {
        const apiKey = mapProvider.getYandexApiKey();
        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(
          trimmed
        )}&format=json&results=5&lang=ru_RU`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const members = data.response?.GeoObjectCollection?.featureMember || [];

          if (members.length > 0) {
            return members.map((m: any) => {
              const obj = m.GeoObject;
              const [lng, lat] = obj.Point.pos.split(" ").map(Number);
              return {
                title: obj.name || trimmed,
                address: obj.metaDataProperty?.GeocoderMetaData?.text || obj.name,
                latitude: lat,
                longitude: lng,
                type: obj.metaDataProperty?.GeocoderMetaData?.kind || "place",
                source: "yandex" as const,
              };
            });
          }
        }
      } catch (err) {
        console.warn("[HybridMapSearch] Yandex Geocoder failed, falling back to Nominatim:", err);
      }
    }

    // 2. Фоллбэк: OpenStreetMap (Nominatim API)
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        trimmed
      )}&format=json&addressdetails=1&limit=5&accept-language=ru`;

      const res = await fetch(osmUrl, {
        headers: { "User-Agent": "VAQTA-AI-HybridMap/1.0" },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: any) => {
            const addrObj = item.address || {};
            const city = addrObj.city || addrObj.town || addrObj.village || addrObj.state || "";
            const road = addrObj.road || addrObj.street || "";
            const house = addrObj.house_number || "";
            let formattedAddr = [city, road, house].filter(Boolean).join(", ");
            if (!formattedAddr) formattedAddr = item.display_name;

            return {
              title: item.nameddetails?.name || item.name || trimmed,
              address: formattedAddr,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              type: item.type || "place",
              source: "openstreetmap" as const,
            };
          });
        }
      }
    } catch (err) {
      console.error("[HybridMapSearch] Nominatim failed:", err);
    }

    return [];
  },

  /**
   * Поиск организаций
   */
  async searchOrganization(query: string, city?: string): Promise<MapSearchResult[]> {
    const fullQuery = city ? `${query}, ${city}` : query;
    return this.searchLocation(fullQuery);
  },

  /**
   * Поиск конкретного адреса
   */
  async searchAddress(address: string): Promise<MapSearchResult | null> {
    const results = await this.searchLocation(address);
    return results.length > 0 ? results[0] : null;
  },

  /**
   * Построение маршрута Yandex Routing -> OSRM fallback
   */
  async buildRoute({ from, to, mode = "driving" }: RouteOptions): Promise<RouteDetail | null> {
    // Резервный OSRM роутер (бесплатный)
    try {
      const profile = mode === "foot" ? "foot" : "car";
      const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

      const res = await fetch(osrmUrl);
      if (res.ok) {
        const data = await res.json();
        const route = data.routes?.[0];
        if (route) {
          return {
            distanceMeters: route.distance,
            durationSeconds: route.duration,
            coordinates: route.geometry?.coordinates || [],
            source: "osrm",
          };
        }
      }
    } catch (err) {
      console.error("[HybridMapSearch] OSRM route error:", err);
    }

    return null;
  },
};