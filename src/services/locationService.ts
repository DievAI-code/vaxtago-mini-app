"use client";

import { dgisProvider } from "./maps/providers/dgisProvider";

export interface LocationResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][];
}

export const locationService = {
  async searchLocation(query: string): Promise<LocationResult | null> {
    const results = await dgisProvider.searchAddress(query);
    if (results.length > 0) {
      const first = results[0];
      return {
        name: first.name,
        address: first.address,
        latitude: first.latitude,
        longitude: first.longitude
      };
    }
    return null;
  },

  async buildRoute(from: [number, number], to: [number, number]): Promise<RouteResult | null> {
    const route = await dgisProvider.buildRoute(from, to);
    if (!route) return null;
    
    return {
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      coordinates: route.geometry
    };
  },

  async geocode(address: string): Promise<[number, number] | null> {
    return dgisProvider.geocodeAddress(address);
  }
};