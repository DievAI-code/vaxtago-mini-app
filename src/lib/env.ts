"use client";

console.log("[YANDEX KEY]", Boolean(import.meta.env.VITE_YANDEX_MAPS_API_KEY));

export function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  if (url.includes("your-project")) return "";
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  if (key.includes("your-anon-key")) return "";
  return key;
}

export function isConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export const getYandexKey = () =>
  import.meta.env.VITE_YANDEX_MAPS_API_KEY || "";

export const getYandexGeocoderKey = () =>
  import.meta.env.VITE_YANDEX_GEOCODER_API_KEY || "";