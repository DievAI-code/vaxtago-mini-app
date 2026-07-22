"use client";

/**
 * Validates and exposes environment variables with production fallbacks.
 * Prevents ERR_NAME_NOT_RESOLVED caused by invalid placeholder domains.
 */

const DEFAULT_SUPABASE_URL = "https://watkanjjfsvqbhebchpk.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdGthbmpqZnN2cWJoZWJjaHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODk5MTYsImV4cCI6MjA5OTI2NTkxNn0.VGXIRn1EpJvLmW-ZvgT4JSMuSaQVszh9YzjmkFOOANY";
const DEFAULT_YANDEX_MAPS_KEY = "6a28f618-4ed1-466d-8d3e-85d74a320991";

export function getSupabaseUrl(): string {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!envUrl || envUrl.includes("your-project") || envUrl.trim() === "") {
    return DEFAULT_SUPABASE_URL;
  }
  return envUrl;
}

export function getSupabaseAnonKey(): string {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!envKey || envKey.includes("your-anon-key") || envKey.trim() === "") {
    return DEFAULT_SUPABASE_ANON_KEY;
  }
  return envKey;
}

export function getYandexKey(): string {
  const envKey = import.meta.env.VITE_YANDEX_MAPS_KEY;
  if (!envKey || envKey.trim() === "") {
    return DEFAULT_YANDEX_MAPS_KEY;
  }
  return envKey;
}

export function checkEnvConfig(): { ok: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!import.meta.env.VITE_SUPABASE_URL) {
    warnings.push("VITE_SUPABASE_URL missing, using fallback host");
  }
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    warnings.push("VITE_SUPABASE_ANON_KEY missing, using fallback key");
  }
  if (!import.meta.env.VITE_YANDEX_MAPS_KEY) {
    warnings.push("VITE_YANDEX_MAPS_KEY missing, using fallback Yandex key");
  }

  if (warnings.length > 0) {
    console.warn("[VaxtaGo Env Check]:", warnings.join("; "));
  }

  return { ok: true, warnings };
}