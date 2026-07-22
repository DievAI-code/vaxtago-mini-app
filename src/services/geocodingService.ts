"use client";

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

const DEFAULT_API_KEY = "6a28f618-4ed1-466d-8d3e-85d74a320991";

/**
 * Strips prefix search phrases from user input.
 */
export function cleanAddressQuery(query: string): string {
  if (!query) return "";

  const prefixes = [
    /^(покажи|найди|где находится|покажи место|покажи адрес|найди адрес|найди место|где)\s+/gi,
    /^(адрес|маршрут|покажи на карте|как доехать|show address|find address|where is)\s+/gi,
    /^(кўрсат|манзил|жой)\s+/gi,
  ];

  let cleaned = query.trim();
  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, "").trim();
  }

  // Also replace internal "покажи адрес" occurrences if repeated
  cleaned = cleaned
    .replace(/(?:покажи|найди|где находится)\s+(?:адрес|место)/gi, "")
    .trim();

  return cleaned || query.trim();
}

export const geocodingService = {
  /**
   * Main search address function using Yandex Geocoder API with fallback.
   */
  async searchAddressFull(rawQuery: string): Promise<GeocodingSearchResponse> {
    const cleanQuery = cleanAddressQuery(rawQuery);

    // Validation for short or incomplete queries like "ер", "а", "1"
    if (!cleanQuery || cleanQuery.length < 3) {
      return {
        results: [],
        isTooShort: true,
        error: "Введите полный адрес:\nгород + улица + дом",
      };
    }

    const apiKey = import.meta.env.VITE_YANDEX_MAPS_KEY || DEFAULT_API_KEY;

    // 1. Try Yandex Geocoder API
    try {
      const yandexUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(
        apiKey
      )}&geocode=${encodeURIComponent(cleanQuery)}&format=json&lang=ru_RU&results=5`;

      const response = await fetch(yandexUrl);

      if (response.ok) {
        const data = await response.json();
        const featureMembers =
          data?.response?.GeoObjectCollection?.featureMember || [];

        if (featureMembers.length > 0) {
          const results: GeocodingResult[] = featureMembers
            .map((item: any) => {
              const geoObject = item.GeoObject;
              if (!geoObject) return null;

              const posStr = geoObject.Point?.pos || ""; // "longitude latitude"
              const [lngStr, latStr] = posStr.split(" ");
              const longitude = parseFloat(lngStr);
              const latitude = parseFloat(latStr);

              if (isNaN(longitude) || isNaN(latitude)) return null;

              const text =
                geoObject.metaDataProperty?.GeocoderMetaData?.text ||
                geoObject.name ||
                "";
              const name = geoObject.name || text.split(",")[0];

              return {
                latitude,
                longitude,
                display_name: text,
                name,
                city: geoObject.description || "",
              };
            })
            .filter(Boolean) as GeocodingResult[];

          if (results.length > 0) {
            return { results };
          }
        }
      }
    } catch (err) {
      console.warn("[Yandex Geocoder Error, falling back to Nominatim]:", err);
    }

    // 2. Fallback to OpenStreetMap Nominatim
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        cleanQuery
      )}&limit=5&addressdetails=1&accept-language=ru`;

      const response = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": "VaxtaGo/3.0 (contact@vaxtago.app)",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const results: GeocodingResult[] = data.map((place: any) => {
            const addr = place.address || {};
            const city =
              addr.city || addr.town || addr.village || addr.state || "";
            return {
              latitude: parseFloat(place.lat),
              longitude: parseFloat(place.lon),
              display_name: place.display_name,
              name: place.name || place.display_name.split(",")[0],
              city,
            };
          });
          return { results };
        }
      }
    } catch (err) {
      console.error("[Nominatim Geocoder Error]:", err);
    }

    return {
      results: [],
      error: "Не удалось найти адрес. Уточните город или улицу.",
    };
  },

  /**
   * Helper returning GeocodingResult[] for backwards compatibility.
   */
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    const res = await this.searchAddressFull(query);
    return res.results;
  },

  async searchEmployers(query: string, city?: string): Promise<GeocodingResult[]> {
    const fullQuery = city ? `${query}, ${city}` : query;
    return this.searchAddress(fullQuery);
  },
};