"use client";

/**
 * Валидация переменных окружения.
 * Fallback значения удалены для обеспечения безопасности и корректности подключения к Supabase.
 */

export function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url || url.includes("your-project") || url.trim() === "") {
    const error = "КРИТИЧЕСКАЯ ОШИБКА: VITE_SUPABASE_URL не настроен в .env файле.";
    console.error(error);
    throw new Error(error);
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key || key.includes("your-anon-key") || key.trim() === "") {
    const error = "КРИТИЧЕСКАЯ ОШИБКА: VITE_SUPABASE_ANON_KEY не настроен в .env файле.";
    console.error(error);
    throw new Error(error);
  }
  return key;
}

export function getYandexKey(): string {
  const key = import.meta.env.VITE_YANDEX_MAPS_KEY;
  if (!key || key.trim() === "") {
    console.warn("[VaxtaGo]: VITE_YANDEX_MAPS_KEY отсутствует. Карты будут работать в ограниченном режиме.");
    return "";
  }
  return key;
}

export function validateEnv() {
  const errors: string[] = [];
  if (!import.meta.env.VITE_SUPABASE_URL) errors.push("VITE_SUPABASE_URL");
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) errors.push("VITE_SUPABASE_ANON_KEY");

  if (errors.length > 0) {
    throw new Error(`Отсутствуют обязательные переменные окружения: ${errors.join(", ")}`);
  }
}