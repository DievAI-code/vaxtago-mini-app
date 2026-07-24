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
  return (
    import.meta.env.VITE_2GIS_API_KEY ||
    import.meta.env.VITE_2GIS_MAP_KEY ||
    "970b6545-3115-46ad-9ab0-fc890a2c42db"
  );
}