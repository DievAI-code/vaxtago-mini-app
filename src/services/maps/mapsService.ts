"use client";

import { dgisProvider, DGISLocation, DGISRoute } from "./providers/dgisProvider";

export type TravelMode = "car" | "walking" | "transit";

export interface RouteOptions {
  from: [number, number] | string;
  to: [number, number] | string;
  mode?: TravelMode;
}

export interface RouteResult {
  distance: string;
  duration: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][];
  steps: {
    instruction: string;
    distance: number;
  }[];
}

class MapsService {
  private provider = dgisProvider;

  async initializeMap(container: HTMLElement, center: [number, number], zoom: number = 12): Promise<boolean> {
    return this.provider.initializeMap(container, center, zoom);
  }

  async searchAddress(query: string): Promise<DGISLocation[]> {
    return this.provider.searchAddress(query);
  }

  async geocodeAddress(address: string): Promise<[number, number] | null> {
    return this.provider.geocodeAddress(address);
  }

  async buildRoute(options: RouteOptions): Promise<RouteResult | null> {
    const { from, to, mode = "car" } = options;

    // Convert string addresses to coordinates
    let fromCoords: [number, number] | null = null;
    let toCoords: [number, number] | null = null;

    if (typeof from === "string") {
      fromCoords = await this.geocodeAddress(from);
    } else {
      fromCoords = from;
    }

    if (typeof to === "string") {
      toCoords = await this.geocodeAddress(to);
    } else {
      toCoords = to;
    }

    if (!fromCoords || !toCoords) {
      throw new Error("Could not geocode addresses");
    }

    const route = await this.provider.buildRoute(
      fromCoords,
      toCoords,
      mode === "transit" ? "car" : mode
    );

    if (!route) return null;

    return {
      distance: `${(route.distanceMeters / 1000).toFixed(1)} км`,
      duration: this.formatDuration(route.durationSeconds),
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      geometry: route.geometry,
      steps: route.steps
    };
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  }

  addMarker(coordinates: [number, number], title: string, onClick?: () => void): any {
    return this.provider.addMarker(coordinates, title, onClick);
  }

  clearMarkers(): void {
    this.provider.clearMarkers();
  }

  displayRoute(route: RouteResult): void {
    this.provider.displayRoute({
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      geometry: route.geometry,
      steps: route.steps
    });
  }

  centerMap(coordinates: [number, number], zoom?: number): void {
    this.provider.centerMap(coordinates, zoom);
  }

  getMapInstance(): any {
    return this.provider.getMapInstance();
  }

  destroy(): void {
    this.provider.destroy();
  }
}

export const mapsService = new MapsService();