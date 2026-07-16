/// <reference path="../deno-env.d.ts" />
import type { Lang } from "./types.ts";

export const DEFAULT_MODELS = [
  "openai/gpt-4o",
  "google/gemini-2.5-flash",
  "anthropic/claude-3.5-haiku",
];

export const APP_DOMAIN = Deno.env.get("APP_DOMAIN") ?? "https://vaxtago.app";
export const TEST_PIN = Deno.env.get("BOT_ACCESS_PASSWORD") ?? "31975";

export const VAXTAGO_SYSTEM_PROMPT = `Ты — AI-помощник VaxtaGo.
Твоя задача: помогать гражданам Узбекистана безопасно работать в России.
Помогай с:
* поиском работы
* вакансиями
* документами
* переводами RU ↔ UZ
* миграционными вопросами
* проверкой работодателей
* маршрутами
Отвечай понятно, кратко и практично.
Всегда отвечай на языке пользователя: русский или узбекский.`;