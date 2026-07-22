"use client";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  type?: string;
}

export const geocodingService = {
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    if (!query || !query.trim()) return [];
    
    try {
      // Подготовка поискового запроса: замена пробелов на +, удаление лишних слов
      const cleanQuery = query
        .replace(/(?:где находится|покажи адрес|найди компанию|покажи на карте|как доехать|найди предприятие|найди)/gi, "")
        .trim();

      console.log(`[Nominatim] Searching: "${cleanQuery}"`);
      
      // Параметры: jsonv2 для детальных данных, limit=5 для списка выбора, ru для языка
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(cleanQuery)}&limit=5&addressdetails=1&accept-language=ru`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "VaqtaAI/1.1 (contact@vaqta.ai; educational/non-commercial)"
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim error: ${response.status}`);
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        console.warn(`[Nominatim] No results for: "${cleanQuery}"`);
        return [];
      }

      return data.map((place: any) => ({
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        display_name: place.display_name,
        name: place.name || place.display_name.split(',')[0],
        type: place.type
      }));
    } catch (error) {
      console.error("[Nominatim] Error:", error);
      return [];
    }
  }
};