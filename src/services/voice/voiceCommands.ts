"use client";

/**
 * Голосовые команды VAQTA AI.
 *
 * Этот модуль — тонкая обёртка над единым Intent Engine
 * (см. @/services/intent), который распознаёт намерения
 * и для текстовых, и для голосовых запросов.
 *
 * Голосовой ввод:
 *   detectVoiceCommand(text) → VoiceCommand (legacy API)
 *   recognizeIntent(text)    → IntentResult (новый единый API)
 *
 * Для нового кода рекомендуется использовать recognizeIntent()
 * напрямую из @/services/intent.
 */

import type { Lang } from "@/i18n";
import {
  recognizeIntent,
  type IntentResult,
  type IntentType,
  type IntentAction,
  type ExtractedEntities,
} from "../intent";

export type VoiceCommandType = IntentType;

export interface VoiceCommand {
  type: VoiceCommandType;
  params: {
    query?: string;
    city?: string;
    profession?: string;
  };
  confidence: number;
  rawText: string;
  language: Lang;
}

export interface CommandAction {
  type: "navigate" | "open_url" | "ai_chat" | "weather" | "none";
  path?: string;
  url?: string;
  message?: string;
  params?: Record<string, unknown>;
}

/**
 * Распознаёт голосовую команду. Обратная совместимость с legacy API.
 * Внутри делегирует в единый Intent Engine.
 */
export function detectVoiceCommand(text: string, appLang: Lang = "ru"): VoiceCommand | null {
  const lang = appLang === "uz" || appLang === "en" || appLang === "ru" ? appLang : "ru";
  const result = recognizeIntent(text, lang);
  if (!result) return null;

  return {
    type: result.intent,
    params: {
      query: result.entities.textObject,
      city: result.entities.city,
      profession: result.entities.profession,
    },
    confidence: result.confidence,
    rawText: result.rawText,
    language: result.language as Lang,
  };
}

/** Маппинг старых path → новых путей (обратная совместимость) */
const LEGACY_PATH_MAP: Record<IntentType, string> = {
  NAVIGATE_HOME: "/home",
  NAVIGATE_AI: "/ai",
  NAVIGATE_SCANNER: "/scanner",
  NAVIGATE_JOBS: "/jobs-test",
  NAVIGATE_MAP: "/maps",
  NAVIGATE_PROFILE: "/cabinet",
  NAVIGATE_TRACKER: "/tracker",
  NAVIGATE_SOS: "/sos",
  NAVIGATE_SETTINGS: "/settings",
  NAVIGATE_ADMIN: "/admin/login",
  NAVIGATE_HISTORY: "/history",
  NAVIGATE_PREMIUM: "/premium",
  VOICE_SETTINGS: "/settings/voice",
  MAP_SEARCH: "/maps",
  MAP_ROUTE: "/maps",
  JOB_SEARCH: "/jobs-test",
  OCR_TRANSLATE: "/scanner",
  DOCUMENT_CHECK: "/ai",
  EMPLOYER_CHECK: "/ai",
  AI_CHAT: "/ai",
  SOS: "/sos",
  PREMIUM: "/premium",
  WEATHER: "/maps",
  CALCULATE_90_180: "/tracker",
  OPEN_VACANCIES_LIST: "/jobs-test",
};

/**
 * Строит действие из распознанной команды.
 * Обратная совместимость с legacy API.
 */
export function buildCommandAction(cmd: VoiceCommand): CommandAction {
  const path = LEGACY_PATH_MAP[cmd.type] || "/";
  let params = "";

  if (cmd.params.city) {
    params = `?city=${encodeURIComponent(cmd.params.city)}`;
  } else if (cmd.params.query) {
    params = `?q=${encodeURIComponent(cmd.params.query)}`;
  }

  const messages: Partial<Record<IntentType, string>> = {
    NAVIGATE_HOME: "Открываю главную",
    NAVIGATE_AI: "Открываю AI-чат",
    NAVIGATE_SCANNER: "Открываю сканер",
    NAVIGATE_JOBS: "Открываю вакансии",
    NAVIGATE_MAP: "Открываю карту",
    NAVIGATE_PROFILE: "Открываю профиль",
    NAVIGATE_TRACKER: "Открываю календарь патента",
    NAVIGATE_SOS: "Открываю SOS",
    NAVIGATE_SETTINGS: "Открываю настройки",
    NAVIGATE_ADMIN: "Открываю админ-панель",
    NAVIGATE_HISTORY: "Открываю историю",
    NAVIGATE_PREMIUM: "Открываю Premium",
    VOICE_SETTINGS: "Открываю голосовые настройки",
    MAP_SEARCH: "Ищу на карте",
    MAP_ROUTE: "Строю маршрут",
    JOB_SEARCH: "Ищу вакансии",
    OCR_TRANSLATE: "Открываю сканер для перевода",
    DOCUMENT_CHECK: "Проверяю документ",
    EMPLOYER_CHECK: "Проверяю работодателя",
    AI_CHAT: "Думаю над ответом",
    SOS: "Открываю SOS",
    PREMIUM: "Открываю Premium",
    WEATHER: "Показываю погоду",
    CALCULATE_90_180: "Открываю калькулятор 90/180",
    OPEN_VACANCIES_LIST: "Открываю список вакансий",
  };

  return {
    type: "navigate",
    path: path + params,
    message: messages[cmd.type] || "Обрабатываю запрос",
    params: cmd.params as Record<string, unknown>,
  };
}