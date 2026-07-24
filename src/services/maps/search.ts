"use client";

export interface MapSearchResult {
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  type?: string;
  source: "openstreetmap";
}

export interface RouteDetail {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][];
  source: "osrm";
}

export interface RouteOptions {
  from: [number, number]; // [lat, lng]
  to: [number, number];   // [lat, lng]
  mode?: "driving" | "foot";
}

export const hybridMapSearch = {
  async searchLocation(query: string): Promise<MapSearchResult[]> {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=ru`);
      if (res.ok) {
        const data = await res.json();
        return data.map((item: any) => ({
          title: item.display_name.split(",")[0],
          address: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          source: "openstreetmap",
        }));
      }
    } catch {}
    return [];
  },

  async searchOrganization(query: string, city?: string): Promise<MapSearchResult[]> {
    return this.searchLocation(city ? `${query} ${city}` : query);
  },

  async searchAddress(address: string): Promise<MapSearchResult | null> {
    const results = await this.searchLocation(address);
    return results.length > 0 ? results[0] : null;
  },

  async buildRoute({ from, to, mode = "driving" }: RouteOptions): Promise<RouteDetail | null> {
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