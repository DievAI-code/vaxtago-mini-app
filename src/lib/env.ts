"use client";

import { YANDEX_MAPS_KEY, YANDEX_GEOCODER_KEY } from "@/config/maps";

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

export function getYandexKey(): string {
  return YANDEX_MAPS_KEY;
}

export function getYandexGeocoderKey(): string {
  return YANDEX_GEOCODER_KEY;
}

export function isConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function logEnvDiagnostics() {
  const yKey = getYandexKey();
  const gKey = getYandexGeocoderKey();
  
  console.log('[VAQTA DIAGNOSTICS]', {
    Supabase: isConfigured() ? '✅ Connected' : '❌ Config Missing',
    YandexMaps: yKey ? `✅ Key Present (${yKey.slice(0, 4)}...)` : '❌ Key Missing (Fallback to OSM)',
    YandexGeocoder: gKey ? `✅ Key Present (${gKey.slice(0, 4)}...)` : '❌ Fallback to Maps Key'
  });
}