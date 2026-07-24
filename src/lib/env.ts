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

export function getYandexKey(): string {
  return import.meta.env.VITE_YANDEX_MAPS_API_KEY || import.meta.env.VITE_YANDEX_MAPS_KEY || "";
}

export function getYandexGeocoderKey(): string {
  return import.meta.env.VITE_YANDEX_GEOCODER_API_KEY || getYandexKey();
}

export function isConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function logEnvDiagnostics() {
  const yKey = getYandexKey();
  const gKey = getYandexGeocoderKey();
  
  console.log('[VAQTA DIAGNOSTICS]', {
    Supabase: isConfigured() ? '✅ Connected' : '❌ Config Missing',
    YandexMaps: yKey ? `✅ Key Present (${yKey.slice(0, 4)}...)` : '❌ Key Missing',
    YandexGeocoder: gKey ? `✅ Key Present (${gKey.slice(0, 4)}...)` : '❌ Fallback to Maps Key'
  });
}

if (typeof window !== 'undefined') {
  logEnvDiagnostics();
}