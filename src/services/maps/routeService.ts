"use client";

export type TravelMode = "car" | "walking" | "transit";

export interface RouteStep {
  instruction: string;
  distance: number;
}

export interface RouteResult {
  distanceKm: string;
  durationMins: number;
  steps: RouteStep[];
  geometry: [number, number][]; // [lat, lng]
  transport?: {
    line: string;
    stop: string;
    transfer: boolean;
  };
}

export const routeService = {
  /**
   * Builds a route between two points using OSRM as primary engine
   */
  async buildRoute(from: [number, number], to: [number, number], mode: TravelMode): Promise<RouteResult | null> {
    try {
      const profile = mode === "walking" ? "foot" : "car";
      // OSRM expects [lng, lat]
      const url = `https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("ROUTE_API_FAILED");
      
      const data = await res.json();
      const route = data.routes?.[0];

      if (!route) return null;

      const result: RouteResult = {
        distanceKm: (route.distance / 1000).toFixed(1),
        durationMins: Math.round(route.duration / 60),
        geometry: route.geometry.coordinates.map((c: any) => [c[1], c[0]]),
        steps: route.legs[0].steps.map((s: any) => ({
          instruction: s.maneuver.instruction,
          distance: s.distance
        }))
      };

      // Mock transit data for prototype purposes if transit mode is selected
      if (mode === "transit") {
        result.transport = {
          line: "Автобус №25",
          stop: "Ближайшая остановка",
          transfer: false
        };
        result.durationMins += 5; // transit wait time overhead
      }

      return result;
    } catch (err) {
      console.error("[RouteService] buildRoute error:", err);
      return null;
    }
  }
};