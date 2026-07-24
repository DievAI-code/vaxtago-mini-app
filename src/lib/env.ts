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

export function get2GISMapKey(): string {
  const key = import.meta.env.VITE_2GIS_MAP_KEY || "";
  if (!key) {
    console.warn("2ГИС API ключ не настроен. Установите VITE_2GIS_MAP_KEY в .env файле. Используется OpenStreetMap.");
  }
  return key;
}