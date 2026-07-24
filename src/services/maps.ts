"use client";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  display_name: string;
}

export interface RouteResult {
  from: [number, number];
  to: [number, number];
  distance: number;
  duration: number;
}

class MapsService {
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&accept-language=ru`;
      const response = await fetch(url, {
        headers: { "User-Agent": "VAQTA-AI-Geocoder/1.0" }
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      return data.map((item: any) => ({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        address: item.name,
        display_name: item.display_name
      }));
    } catch (error) {
      console.error("Geocoding error:", error);
      return [];
    }
  }
  
  async geocodeAddress(address: string): Promise<[number, number] | null> {
    const results = await this.searchAddress(address);
    if (results.length > 0) {
      return [results[0].longitude, results[0].latitude];
    }
    return null;
  }
  
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`;
      const response = await fetch(url, {
        headers: { "User-Agent": "VAQTA-AI-Geocoder/1.0" }
      });
      
      if (!response.ok) return "";
      
      const data = await response.json();
      return data.display_name || "";
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return "";
    }
  }
  
  async calculateRoute(from: [number, number], to: [number, number]): Promise<RouteResult | null> {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=false`);
      if (res.ok) {
        const data = await res.json();
        const route = data.routes?.[0];
        if (route) {
          return {
            from,
            to,
            distance: route.distance,
            duration: route.duration
          };
        }
      }
    } catch {}
    return null;
  }
  
  openYandexMaps(coordinates: [number, number], address?: string) {
    const [lng, lat] = coordinates;
    const url = `https://www.google.com/maps/?q=${lat},${lng}`;
    window.open(url, '_blank');
  }
  
  openYandexRoute(from: [number, number], to: [number, number]) {
    const [fromLng, fromLat] = from;
    const [toLng, toLat] = to;
    const url = `https://www.google.com/maps/?rtext=${fromLat},${fromLng}~${toLat},${toLng}&rtt=auto`;
    window.open(url, '_blank');
  }
}

export const mapsService = new MapsService();