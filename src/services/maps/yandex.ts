"use client";

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
  coordinates: [number, number][]; // [lng, lat]
  source: "yandex" | "osrm";
}

let yandexScriptPromise: Promise<void> | null = null;

export const yandexService = {
  getMapsApiKey(): string {
    return import.meta.env.VITE_YANDEX_MAPS_API_KEY || "";
  },

  getGeocoderApiKey(): string {
    return (
      import.meta.env.VITE_YANDEX_GEOCODER_API_KEY ||
      import.meta.env.VITE_YANDEX_MAPS_API_KEY ||
      ""
    );
  },

  /**
   * Safe script loader for Yandex Maps JS API v3
   */
  async loadYandexMaps(): Promise<boolean> {
    const key = this.getMapsApiKey();
    if (!key || key.trim().length < 5) {
      console.warn("[Yandex Service] VITE_YANDEX_MAPS_API_KEY missing or invalid.");
      return false;
    }

    if (window.ymaps3) {
      try {
        await window.ymaps3.ready;
        return true;
      } catch (err) {
        console.warn("[Yandex Service] window.ymaps3 ready error:", err);
        return false;
      }
    }

    if (yandexScriptPromise) {
      try {
        await yandexScriptPromise;
        return true;
      } catch {
        return false;
      }
    }

    yandexScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(key)}&lang=ru_RU`;
      script.async = true;

      script.onload = () => {
        if (window.ymaps3) {
          window.ymaps3.ready
            .then(() => resolve())
            .catch((e: any) => reject(e));
        } else {
          reject(new Error("ymaps3 object not found on window"));
        }
      };

      script.onerror = () => {
        yandexScriptPromise = null;
        reject(new Error("Failed to load Yandex Maps script from network"));
      };

      document.head.appendChild(script);
    });

    try {
      await yandexScriptPromise;
      return true;
    } catch (err) {
      console.warn("[Yandex Service] Could not load Yandex Maps script, app will use OpenStreetMap fallback:", err);
      return false;
    }
  },

  /**
   * Geocoding function with 403 & error handling, automatically falling back to OpenStreetMap
   */
  async geocode(query: string): Promise<YandexSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const key = this.getGeocoderApiKey();

    if (key && key.trim().length > 5) {
      try {
        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(
          key
        )}&geocode=${encodeURIComponent(trimmed)}&format=json&results=5&lang=ru_RU`;

        const res = await fetch(url);

        if (res.status === 403) {
          console.warn("[Yandex Service] Geocoder returned 403 Forbidden. Using OpenStreetMap Nominatim fallback...");
        } else if (res.ok) {
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
        console.warn("[Yandex Service] Geocoder request failed:", err);
      }
    }

    // OpenStreetMap (Nominatim) Fallback
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        trimmed
      )}&format=json&addressdetails=1&limit=5&accept-language=ru`;

      const res = await fetch(osmUrl, {
        headers: { "User-Agent": "VAQTA-AI-YandexService/1.0" },
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
      console.error("[Yandex Service] OSM Nominatim fallback failed:", err);
    }

    return [];
  },

  /**
   * Search for organizations with location/city context
   */
  async searchOrganization(query: string, city?: string): Promise<YandexSearchResult[]> {
    const fullQuery = city ? `${query}, ${city}` : query;
    return this.geocode(fullQuery);
  },

  /**
   * Route building with OSRM fallback
   */
  async buildRoute(
    from: [number, number], // [lat, lng]
    to: [number, number],   // [lat, lng]
    mode: "driving" | "foot" = "driving"
  ): Promise<YandexRouteResult | null> {
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
      console.error("[Yandex Service] Route building failed:", err);
    }

    return null;
  },
};