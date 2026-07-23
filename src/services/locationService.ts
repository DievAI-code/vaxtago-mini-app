"use client";

export interface LocationResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type?: string;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][]; // [longitude, latitude]
}

export const locationService = {
  /**
   * Поиск локации через бесплатный OpenStreetMap Nominatim API
   */
  async searchLocation(query: string): Promise<LocationResult | null> {
    const trimmed = query.trim();
    if (!trimmed) return null;

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        trimmed
      )}&format=json&addressdetails=1&limit=1&accept-language=ru`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "VAQTA-AI-App/1.0",
        },
      });

      if (!response.ok) throw new Error(`HTTP_${response.status}`);

      const data = await response.json();
      if (!data || data.length === 0) return null;

      const first = data[0];
      const addressObj = first.address || {};
      const cityName =
        addressObj.city ||
        addressObj.town ||
        addressObj.village ||
        addressObj.state ||
        "";
      const road = addressObj.road || addressObj.street || "";
      const house = addressObj.house_number || "";

      let formattedAddr = [cityName, road, house].filter(Boolean).join(", ");
      if (!formattedAddr) formattedAddr = first.display_name;

      return {
        name: first.nameddetails?.name || first.name || trimmed,
        address: formattedAddr,
        latitude: parseFloat(first.lat),
        longitude: parseFloat(first.lon),
        type: first.type || "place",
      };
    } catch (err) {
      console.error("[LocationService] Nominatim error:", err);
      return null;
    }
  },

  /**
   * Построение маршрута через OSRM Routing API (бесплатный сервис)
   */
  async buildRoute(
    from: [number, number], // [lat, lng]
    to: [number, number], // [lat, lng]
    mode: "driving" | "foot" = "driving"
  ): Promise<RouteResult | null> {
    try {
      const profile = mode === "foot" ? "foot" : "car";
      const url = `https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("OSRM_ERROR");

      const data = await response.json();
      const route = data.routes?.[0];

      if (!route) return null;

      return {
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        coordinates: route.geometry?.coordinates || [],
      };
    } catch (err) {
      console.error("[LocationService] OSRM error:", err);
      return null;
    }
  },
};