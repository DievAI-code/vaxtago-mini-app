"use client";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
}

export const geocodingService = {
  async searchAddress(address: string): Promise<GeocodingResult | null> {
    if (!address || !address.trim()) return null;
    
    try {
      console.log(`[Nominatim] Geocoding address: "${address}"`);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          "Accept-Language": "ru,uz,tg,en",
          "User-Agent": "VaqtaAI/1.0 (contact@vaqta.ai; educational/non-commercial)"
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        console.warn(`[Nominatim] No results found for: "${address}"`);
        return null;
      }

      const place = data[0];
      return {
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        display_name: place.display_name,
        name: place.name || place.class
      };
    } catch (error) {
      console.error("[Nominatim] Error during geocoding:", error);
      return null;
    }
  }
};