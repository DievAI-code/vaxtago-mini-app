"use client";

export type TravelMode = "driving" | "walking" | "transit";

export interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  geometry: [number, number][]; // [lat, lng]
  steps: string[];
}

export const routeService = {
  /**
   * Fetches a route using OSRM (Open Source Routing Machine) as fallback
   * 2GIS usually handles this in the JS SDK, but for external API use OSRM is reliable.
   */
  async getRoute(from: [number, number], to: [number, number], mode: TravelMode = "driving"): Promise<RouteResult | null> {
    try {
      const profile = mode === "walking" ? "foot" : "car";
      // OSRM expects [lng, lat]
      const url = `https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("OSRM_FAILED");
      
      const data = await res.json();
      const route = data.routes?.[0];

      if (!route) return null;

      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry.coordinates.map((c: any) => [c[1], c[0]]), // convert back to [lat, lng]
        steps: route.legs[0].steps.map((s: any) => s.maneuver.instruction)
      };
    } catch (err) {
      console.error("[RouteService] Error:", err);
      return null;
    }
  }
};