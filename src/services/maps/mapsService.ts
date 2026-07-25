"use client";

export type MapProviderType = "yandex" | "2gis";

export const mapProvider = {
  getProviderState(): { activeProvider: MapProviderType } {
    return { activeProvider: "yandex" };
  },

  isYandexAvailable(): boolean {
    return true;
  },

  is2GISAvailable(): boolean {
    return true;
  },
};