"use client";

import { yandexService } from "@/services/maps/yandex";

export function loadYandexMaps(): Promise<boolean> {
  return yandexService.loadYandexMaps();
}

export const yandexMapsFallback = {
  searchAddress: async (query: string) => {
    return yandexService.geocode(query);
  },
  
  createRoute: (lat: number, lng: number) => {
    const url = `https://yandex.ru/maps/?rtext=~${lat},${lng}&rtt=auto`;
    window.open(url, "_blank");
  }
};