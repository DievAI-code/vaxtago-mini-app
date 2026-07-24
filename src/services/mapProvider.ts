"use client";

import { get2GISMapKey } from "@/lib/env";

export type MapProviderType = "2gis" | "openstreetmap";

export interface MapProviderState {
  activeProvider: MapProviderType;
}

export function is2GISAvailable(): boolean {
  return Boolean(import.meta.env.VITE_2GIS_MAP_KEY);
}

export const mapProvider = {
  getProviderState(): MapProviderState {
    return {
      activeProvider: is2GISAvailable() ? "2gis" : "openstreetmap",
    };
  },

  is2GISAvailable,

  get2GISKey(): string {
    return get2GISMapKey();
  }
};