"use client";

import { yandexService } from "./yandex";

export type MapProviderType = "yandex" | "openstreetmap";

export interface MapProviderState {
  activeProvider: MapProviderType;
  hasYandexKey: boolean;
}

export const mapProvider = {
  getYandexApiKey(): string {
    return yandexService.getMapsApiKey();
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