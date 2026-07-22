"use client";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  type?: string;
  phone?: string;
  website?: string;
  city?: string;
}

export const geocodingService = {
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    if (!query || !query.trim()) return [];
    
    try {
      // Очистка вводных команд
      let cleanQuery = query
        .replace(/(?:где находится|покажи адрес|найди компанию|покажи на карте|как доехать|найди предприятие|найди|адрес|маршрут)/gi, "")
        .trim();

      if (!cleanQuery) cleanQuery = query.trim();

      console.log(`[Nominatim Search] Query: "${cleanQuery}"`);
      
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(cleanQuery)}&limit=5&addressdetails=1&accept-language=ru`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "VaqtaAI/3.0 (contact@vaqta.ai; educational/non-commercial)"
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim error: ${response.status}`);
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        console.warn(`[Nominatim] No direct results for "${cleanQuery}"`);
        return [];
      }

      return data.map((place: any) => {
        const addr = place.address || {};
        const city = addr.city || addr.town || addr.village || addr.state || "";
        return {
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon),
          display_name: place.display_name,
          name: place.name || place.display_name.split(',')[0],
          type: place.type,
          city
        };
      });
    } catch (error) {
      console.error("[Nominatim Service Error]:", error);
      return [];
    }
  },

  async searchEmployers(query: string, city?: string): Promise<GeocodingResult[]> {
    const fullQuery = city ? `${query}, ${city}` : query;
    return this.searchAddress(fullQuery);
  }
};