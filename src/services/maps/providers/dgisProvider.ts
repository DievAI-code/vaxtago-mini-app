"use client";

import { get2GISMapKey } from "@/lib/env";

export interface DGISLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface DGISRoute {
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][];
  steps: { instruction: string; distance: number }[];
}

class DGISProvider {
  async searchAddress(query: string): Promise<DGISLocation[]> {
    try {
      const apiKey = get2GISMapKey();
      const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&key=${apiKey}&fields=items.point,items.name,items.address_name&limit=10`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      const items = data.result?.items || [];

      return items
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          address: item.address_name || item.full_name || "",
          latitude: item.point?.lat,
          longitude: item.point?.lon,
        }))
        .filter((loc: DGISLocation) => loc.latitude && loc.longitude);
    } catch (error) {
      console.error("[2GIS] Search error:", error);
      return [];
    }
  }

  async geocodeAddress(address: string): Promise<[number, number] | null> {
    const results = await this.searchAddress(address);
    if (results.length > 0) {
      return [results[0].latitude, results[0].longitude];
    }
    return null;
  }

  async buildRoute(
    from: [number, number],
    to: [number, number],
    mode: "car" | "walking" = "car"
  ): Promise<DGISRoute | null> {
    try {
      const profile = mode === "walking" ? "foot" : "car";
      const url = `https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Route failed");
      const data = await response.json();
      const route = data.routes?.[0];
      if (!route) return null;

      return {
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        geometry: route.geometry.coordinates.map((c: any) => [c[1], c[0]]),
        steps: route.legs[0].steps.map((s: any) => ({
          instruction: s.maneuver.instruction,
          distance: s.distance,
        })),
      };
    } catch {
      return null;
    }
  }

  /**
   * Navigate in 2GIS — opens deep link or web URL.
   */
  openRoute(from: string, to: string, mode: "car" | "walking" | "transit" = "car"): void {
    const fromEncoded = encodeURIComponent(from);
    const toEncoded = encodeURIComponent(to);
    const type = mode === "walking" ? "foot" : mode === "transit" ? "bus" : "car";
    const deepLink = `dgis://2gis.ru/directions?from=${fromEncoded}&to=${toEncoded}&type=${type}`;
    const webUrl = `https://2gis.ru/directions?from=${fromEncoded}&to=${toEncoded}&type=${type}&m=1`;

    this.tryOpenDeepLink(deepLink, webUrl);
  }

  private tryOpenDeepLink(deepLink: string, webUrl: string): void {
    const link = document.createElement("a");
    link.href = deepLink;
    link.style.display = "none";
    document.body.appendChild(link);

    const startTime = Date.now();
    const handleBlur = () => {
      if (Date.now() - startTime < 100) {
        cleanup();
      }
    };

    const fallback = window.setTimeout(() => {
      window.open(webUrl, "_blank", "noopener,noreferrer");
      cleanup();
    }, 1500);

    const cleanup = () => {
      window.clearTimeout(fallback);
      window.removeEventListener("blur", handleBlur);
      if (link.parentNode) link.parentNode.removeChild(link);
    };

    link.click();
    window.addEventListener("blur", handleBlur);
  }
}

export const dgisProvider = new DGISProvider();