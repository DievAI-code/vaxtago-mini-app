"use client";

/**
 * Валидация и экспорт переменных окружения.
 * Предотвращает ошибки ERR_NAME_NOT_RESOLVED при использовании шаблонов.
 */

const FALLBACK_SUPABASE_URL = "https://watkanjjfsvqbhebchpk.supabase.co";
const FALLBACK_SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdGthbmpqZnN2cWJoZWJjaHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODk5MTYsImV4cCI6MjA5OTI2NTkxNn0.VGXIRn1EpJvLmW-ZvgT4JSMuSaQVszh9YzjmkFOOANY";

export function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url || url.includes("your-project") || url.trim() === "") {
    console.warn("[VaxtaGo]: VITE_SUPABASE_URL не настроен или содержит шаблон. Используется fallback.");
    return FALLBACK_SUPABASE_URL;
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key || key.includes("your-anon-key") || key.trim() === "") {
    console.warn("[VaxtaGo]: VITE_SUPABASE_ANON_KEY не настроен. Используется fallback.");
    return FALLBACK_SUPABASE_ANON;
  }
  return key;
}

export function getYandexKey(): string {
  const key = import.meta.env.VITE_YANDEX_MAPS_KEY;
  if (!key || key.trim() === "") {
    console.error("[VaxtaGo]: VITE_YANDEX_MAPS_KEY отсутствует! Карты не будут работать.");
    return "";
  }
  return key;
}

export function validateEnv() {
  const errors: string[] = [];
  if (!import.meta.env.VITE_SUPABASE_URL) errors.push("VITE_SUPABASE_URL");
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) errors.push("VITE_SUPABASE_ANON_KEY");
  if (!import.meta.env.VITE_YANDEX_MAPS_KEY) errors.push("VITE_YANDEX_MAPS_KEY");

  if (errors.length > 0) {
    console.error(`[VaxtaGo Critical]: Отсутствуют переменные окружения: ${errors.join(", ")}`);
  }
}