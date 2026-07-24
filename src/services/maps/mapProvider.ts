"use client";

import { getYandexKey } from "@/lib/env";

export type MapProviderType = "yandex" | "openstreetmap";

export interface MapProviderState {
  activeProvider: MapProviderType;
  hasYandexKey: boolean;
}

export const mapProvider = {
  getYandexApiKey(): string {
    return (
      import.meta.env.VITE_YANDEX_MAPS_API_KEY ||
      import.meta.env.VITE_YANDEX_MAPS_KEY ||
      getYandexKey() ||
      ""
    );
  },

  getProviderState(): MapProviderState {
    const key = this.getYandexApiKey();
    const hasKey = Boolean(key && key.trim().length > 5);
    return {
      activeProvider: hasKey ? "yandex" : "openstreetmap",
      hasYandexKey: hasKey,
    };
  },

  isYandexAvailable(): boolean {
    return this.getProviderState().hasYandexKey;
  },
};