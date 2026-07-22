"use client";

/**
 * Модуль валидации окружения.
 * Гарантирует, что приложение не будет делать запросы к 'your-project' шаблонам.
 */

export function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url || url.includes("your-project")) {
    console.error("CRITICAL: VITE_SUPABASE_URL is missing or invalid.");
    return ""; 
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key || key.includes("your-anon-key")) {
    console.error("CRITICAL: VITE_SUPABASE_ANON_KEY is missing or invalid.");
    return "";
  }
  return key;
}

export function getYandexKey(): string {
  return import.meta.env.VITE_YANDEX_MAPS_KEY || "";
}

/**
 * Проверка готовности приложения к работе с внешними API
 */
export function isConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}