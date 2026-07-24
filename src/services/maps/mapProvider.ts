"use client";

export type MapProviderType = "openstreetmap";

export interface MapProviderState {
  activeProvider: MapProviderType;
}

export const mapProvider = {
  getProviderState(): MapProviderState {
    return {
      activeProvider: "openstreetmap",
    };
  },

  isYandexAvailable(): boolean {
    return false;
  },
};