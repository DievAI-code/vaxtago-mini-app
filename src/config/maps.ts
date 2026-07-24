"use client";

/**
 * Единый источник конфигурации для Yandex Maps API.
 * Возвращает пустую строку, если ключ не найден, чтобы не ломать приложение.
 */
export const YANDEX_MAPS_KEY: string =
  (import.meta.env.VITE_YANDEX_MAPS_API_KEY as string) || "";

export const YANDEX_GEOCODER_KEY: string =
  (import.meta.env.VITE_YANDEX_GEOCODER_API_KEY as string) || YANDEX_MAPS_KEY;

export const HAS_YANDEX_MAPS: boolean = Boolean(YANDEX_MAPS_KEY && YANDEX_MAPS_KEY.length > 5);
export const HAS_YANDEX_GEOCODER: boolean = Boolean(YANDEX_GEOCODER_KEY && YANDEX_GEOCODER_KEY.length > 5);

/**
 * Development-only диагностика.
 * Помогает быстро понять, почему карта не грузится.
 */
if (import.meta.env.DEV) {
  console.log("[Yandex Config]", {
    mapsKey: YANDEX_MAPS_KEY ? `exists (${YANDEX_MAPS_KEY.slice(0, 4)}...)` : "missing",
    geocoderKey: YANDEX_GEOCODER_KEY ? `exists (${YANDEX_GEOCODER_KEY.slice(0, 4)}...)` : "missing",
    activeProvider: HAS_YANDEX_MAPS ? "yandex" : "openstreetmap",
  });
}