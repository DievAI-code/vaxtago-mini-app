"use client";

/**
 * Validates and exposes environment variables.
 * Ensures no 'your-project.supabase.co' templates leak into production.
 */

// These are internal fallbacks only if ENV is completely missing to prevent app crash
const PROD_SUPABASE_URL = "https://watkanjjfsvqbhebchpk.supabase.co";
const PROD_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdGthbmpqZnN2cWJoZWJjaHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODk5MTYsImV4cCI6MjA5OTI2NTkxNn0.VGXIRn1EpJvLmW-ZvgT4JSMuSaQVszh9YzjmkFOOANY";
const PROD_YANDEX_KEY = "6a28f618-4ed1-466d-8d3e-85d74a320991";

export function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url || url.includes("your-project") || url.trim() === "") {
    console.error("[VaxtaGo Config Error]: VITE_SUPABASE_URL is missing or invalid.");
    return PROD_SUPABASE_URL;
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key || key.includes("your-anon-key") || key.trim() === "") {
    console.error("[VaxtaGo Config Error]: VITE_SUPABASE_ANON_KEY is missing.");
    return PROD_SUPABASE_ANON_KEY;
  }
  return key;
}

export function getYandexKey(): string {
  const key = import.meta.env.VITE_YANDEX_MAPS_KEY;
  if (!key || key.trim() === "") {
    return PROD_YANDEX_KEY;
  }
  return key;
}

export function validateEnv() {
  const isMissing = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (isMissing) {
    console.warn("[VaxtaGo]: Running with fallback configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
  }
  return !isMissing;
}