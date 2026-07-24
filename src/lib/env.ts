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

export const getYandexMapsKey = () => {
  const key = import.meta.env.VITE_YANDEX_MAPS_API_KEY || "";
  console.log("[YANDEX MAP KEY EXISTS]", Boolean(key));
  return key;
};

export const getYandexGeocoderKey = () => {
  const key = import.meta.env.VITE_YANDEX_GEOCODER_API_KEY || "";
  return key;
};