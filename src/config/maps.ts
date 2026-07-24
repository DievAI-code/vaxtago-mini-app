"use client";

export const YANDEX_MAPS_API_KEY: string =
  (import.meta.env.VITE_YANDEX_MAPS_API_KEY as string) || "";

export const YANDEX_GEOCODER_API_KEY: string =
  (import.meta.env.VITE_YANDEX_GEOCODER_API_KEY as string) || YANDEX_MAPS_API_KEY;

export const hasYandexMapsKey: boolean = Boolean(
  YANDEX_MAPS_API_KEY && YANDEX_MAPS_API_KEY.length > 5
);

export const hasYandexGeocoderKey: boolean = Boolean(
  YANDEX_GEOCODER_API_KEY && YANDEX_GEOCODER_API_KEY.length > 5
);

if (import.meta.env.DEV) {
  console.log("[Yandex Config]", {
    mapsKey: YANDEX_MAPS_API_KEY ? "exists" : "missing",
    geocoderKey: YANDEX_GEOCODER_API_KEY ? "exists" : "missing",
    activeProvider: hasYandexMapsKey ? "yandex" : "openstreetmap",
  });
}