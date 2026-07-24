"use client";

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

export function getYandexMapsKey(): string {
  const key = import.meta.env.VITE_YANDEX_MAPS_KEY || "";
  console.log("[YANDEX MAP KEY]", Boolean(key));
  return key;
}

export function getYandexGeocoderKey(): string {
  const key = import.meta.env.VITE_YANDEX_GEOCODER || "";
  console.log("[YANDEX GEOCODER KEY]", Boolean(key));
  return key;
}