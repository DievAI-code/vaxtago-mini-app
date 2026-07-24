"use client";

import { get2GISMapKey } from "@/lib/env";

export type MapProviderType = "2gis";

export interface MapProviderState {
  activeProvider: MapProviderType;
}

export function is2GISAvailable(): boolean {
  return Boolean(get2GISMapKey());
}

export const mapProvider = {
  getProviderState(): MapProviderState {
    return {
      activeProvider: "2gis",
    };
  },

  is2GISAvailable,

  get2GISKey(): string {
    return get2GISMapKey();
  }
};