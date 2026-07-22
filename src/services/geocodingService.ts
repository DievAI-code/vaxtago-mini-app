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

const ORG_KEYWORDS = [
  "вокзал", "аэропорт", "магазин", "завод", "больница", "гостиница",
  "работодатель", "кафе", "организация", "мвд", "мц", "сахарово",
  "автовокзал", "рынок", "отель", "предприятие", "станция", "метро"
];

/**
 * Strips search prefixes, city labels, and normalizes word cases.
 * Example: "найди адрес жд вокзала г.Тюмени" -> "жд вокзал Тюмень"
 */
export function cleanAddressQuery(query: string): string {
  if (!query) return "";

  let cleaned = query.trim();

  // 1. Remove action prefixes
  const prefixes = [
    /^(найди адрес|покажи адрес|где находится|найти место|покажи на карте|маршрут до|покажи место|покажи|найди|где|адрес|маршрут|как доехать|поищи)\s+/gi,
    /^(кўрсат|манзил|жой)\s+/gi,
  ];

  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, "").trim();
  }

  cleaned = cleaned.replace(/(?:покажи|найди|где находится)\s+(?:адрес|место)/gi, "").trim();

  // 2. Remove city prefix labels like "г." or "город"
  cleaned = cleaned.replace(/\bг\.\s*/gi, " ");
  cleaned = cleaned.replace(/\bгород\s+/gi, " ");

  // 3. Normalize common Russian city inflections
  cleaned = cleaned
    .replace(/\bтюмени\b/gi, "Тюмень")
    .replace(/\bмосквы\b/gi, "Москва")
    .replace(/\bпетербурга\b/gi, "Санкт-Петербург")
    .replace(/\bпитера\b/gi, "Санкт-Петербург")
    .replace(/\bташкента\b/gi, "Ташкент")
    .replace(/\bказани\b/gi, "Казань")
    .replace(/\bекатеринбурга\b/gi, "Екатеринбург");

  // Normalize double spaces
  return cleaned.replace(/\s+/g, " ").trim();
}

/**
 * Checks if the query is an organization or point of interest (POI).
 */
export function isOrgQuery(query: string): boolean {
  const low = query.toLowerCase();
  return ORG_KEYWORDS.some((kw) => low.includes(kw));
}

/**
 * Validates whether a returned result is relevant to the POI search.
 * Rejects arbitrary residential districts or unmatching places.
 */function isResultRelevant(cleanQuery: string, result: GeocodingResult): boolean {
  const queryLow = cleanQuery.toLowerCase();
  const resLow = (result.display_name + " " + (result.name || "")).toLowerCase();

  // Check key words from query in result
  if (queryLow.includes("вокзал") && !resLow.includes("вокзал") && !resLow.includes("станция") && !resLow.includes("привокзал")) {
    return false;
  }
  if (queryLow.includes("аэропорт") && !resLow.includes("аэропорт") && !resLow.includes("рощино") && !resLow.includes("домодедово") && !resLow.includes("шереметьево") && !resLow.includes("внуково") && !resLow.includes("пулково")) {
    return false;
  }
  if (queryLow.includes("больница") && !resLow.includes("больница") && !resLow.includes("клиника") && !resLow.includes("госпиталь") && !resLow.includes("медицин")) {
    return false;
  }

  return true;
}

export const geocodingService = {
  /**
   * Search address or POI using Yandex Geocoder + OpenStreetMap Nominatim with relevance checks.
   */
  async searchAddressFull(rawQuery: string): Promise<GeocodingSearchResponse> {
    const cleanQuery = cleanAddressQuery(rawQuery);

    if (!cleanQuery || cleanQuery.length < 2) {
      return {
        results: [],
        isTooShort: true,
        error: "Не удалось найти объект. Попробуйте уточнить название или город.",
      };
    }

    const apiKey = import.meta.env.VITE_YANDEX_MAPS_KEY || DEFAULT_API_KEY;
    const isOrg = isOrgQuery(cleanQuery);

    // 1. Try Nominatim first for POI/Org queries as it handles POIs accurately
    if (isOrg) {
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
            const results: GeocodingResult[] = data
              .map((place: any) => {
                const addr = place.address || {};
                const city =
                  addr.city || addr.town || addr.village || addr.state || "";
                const name = place.name || place.display_name.split(",")[0];
                return {
                  latitude: parseFloat(place.lat),
                  longitude: parseFloat(place.lon),
                  display_name: place.display_name,
                  name,
                  city,
                };
              })
              .filter((res: GeocodingResult) => isResultRelevant(cleanQuery, res));

            if (results.length > 0) {
              return { results };
            }
          }
        }
      } catch (err) {
        console.warn("[Nominatim POI Search Warning]:", err);
      }
    }

    // 2. Yandex Geocoder API
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
            .filter((res: GeocodingResult | null) => res !== null && (!isOrg || isResultRelevant(cleanQuery, res))) as GeocodingResult[];

          if (results.length > 0) {
            return { results };
          }
        }
      }
    } catch (err) {
      console.warn("[Yandex Geocoder Warning]:", err);
    }

    // 3. Fallback Nominatim for street addresses
    if (!isOrg) {
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
    }

    return {
      results: [],
      error: "Не удалось найти объект. Попробуйте уточнить название или город.",
    };
  },

  async searchAddress(query: string): Promise<GeocodingResult[]> {
    const res = await this.searchAddressFull(query);
    return res.results;
  },

  async searchEmployers(query: string, city?: string): Promise<GeocodingResult[]> {
    const fullQuery = city ? `${query}, ${city}` : query;
    return this.searchAddress(fullQuery);
  },
};