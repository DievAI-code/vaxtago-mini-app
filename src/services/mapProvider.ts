"use client";

import { get2GISMapKey } from "@/lib/env";

export type MapProviderType = "2gis" | "openstreetmap";

export interface MapProviderState {
  activeProvider: MapProviderType;
}

export const mapProvider = {
  getProviderState(): MapProviderState {
    return {
      activeProvider: get2GISMapKey() ? "2gis" : "openstreetmap",
    };
  },

  is2GISAvailable(): boolean {
    return Boolean(get2GISMapKey());
  },

  get2GISKey(): string {
    return get2GISMapKey();
  }
};