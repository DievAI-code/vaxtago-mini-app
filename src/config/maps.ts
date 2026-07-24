"use client";

import { getYandexMapsKey, getYandexGeocoderKey } from "@/lib/env";

export const YANDEX_MAPS_API_KEY: string = getYandexMapsKey();
export const YANDEX_GEOCODER_API_KEY: string = getYandexGeocoderKey();

export const hasYandexMapsKey: boolean = Boolean(
  YANDEX_MAPS_API_KEY && YANDEX_MAPS_API_KEY.length > 5
);

export const hasYandexGeocoderKey: boolean = Boolean(
  YANDEX_GEOCODER_API_KEY && YANDEX_GEOCODER_API_KEY.length > 5
);