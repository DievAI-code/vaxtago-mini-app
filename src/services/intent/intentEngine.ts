/**
 * Главный движок распознавания намерений (Intent Engine).
 *
 * Единая точка входа для:
 *  - AI-чата (текстовые сообщения)
 *  - голосового помощника (STT → текст → intent)
 *  - поиска вакансий
 *  - карт и навигации
 *  - OCR-перевода
 *  - проверки документов
 *  - SOS
 *  - Premium
 *
 * Использование:
 *   import { recognizeIntent } from "@/services/intent";
 *   const result = recognizeIntent("Toshkentda haydovchi ish top", "uz");
 *   // → { intent: "JOB_SEARCH", entities: { city: "Ташкент", profession: "Водитель" }, ... }
 */

import type { IntentType, IntentRule } from "./intentDictionary";
import { INTENT_RULES } from "./intentDictionary";
import { extractAllEntities, normalizeInput, detectLanguage, type ExtractedEntities } from "./entityExtractor";
import { buildReply } from "./responseDictionary";

export type { IntentType, ExtractedEntities };
export { INTENT_RULES };

/** Действие, которое UI должен выполнить */
export type IntentAction = "navigate" | "open_jobs" | "open_map" | "open_scanner" | "open_admin" | "open_sos" | "open_settings" | "open_premium" | "open_voice_settings" | "open_calendar" | "open_history" | "open_profile" | "open_home" | "ai_chat" | "show_weather" | "none";

/** Финальный результат распознавания */
export interface IntentResult {
  /** Тип намерения */
  intent: IntentType;
  /** Уверенность 0..1 */
  confidence: number;
  /** Распознанный язык */
  language: "ru" | "uz" | "en";
  /** Извлечённые сущности */
  entities: ExtractedEntities;
  /** Короткий текст ответа для UI */
  reply: string;
  /** Что должен сделать UI */
  action: IntentAction;
  /** Куда перенаправить пользователя */
  route: string;
  /** Оригинальный текст */
  rawText: string;
  /** Нормализованный текст (для отладки) */
  normalizedText: string;
}

// ────────────────────────────────────────────────────────────────────
// Предкомпилированные regex (производительность)
// ────────────────────────────────────────────────────────────────────
const REGEX_CACHE = new Map<string, RegExp>();
function getRegex(pattern: string, flags = "i"): RegExp {
  const key = `${flags}::${pattern}`;
  let re = REGEX_CACHE.get(key);
  if (!re) {
    re = new RegExp(pattern, flags);
    REGEX_CACHE.set(key, re);
  }
  return re;
}

// ────────────────────────────────────────────────────────────────────
// Маппинг intent → action + route
// ────────────────────────────────────────────────────────────────────
const ACTION_MAP: Record<IntentType, { action: IntentAction; route: string }> = {
  MAP_SEARCH: { action: "open_map", route: "/maps" },
  MAP_ROUTE: { action: "open_map", route: "/maps" },
  JOB_SEARCH: { action: "open_jobs", route: "/jobs-test" },
  OCR_TRANSLATE: { action: "open_scanner", route: "/scanner" },
  DOCUMENT_CHECK: { action: "ai_chat", route: "/ai" },
  EMPLOYER_CHECK: { action: "ai_chat", route: "/ai" },
  AI_CHAT: { action: "ai_chat", route: "/ai" },
  SOS: { action: "open_sos", route: "/sos" },
  PREMIUM: { action: "open_premium", route: "/premium" },
  NAVIGATE_HOME: { action: "open_home", route: "/home" },
  NAVIGATE_AI: { action: "navigate", route: "/ai" },
  NAVIGATE_SCANNER: { action: "open_scanner", route: "/scanner" },
  NAVIGATE_JOBS: { action: "open_jobs", route: "/jobs-test" },
  NAVIGATE_MAP: { action: "open_map", route: "/maps" },
  NAVIGATE_PROFILE: { action: "open_profile", route: "/cabinet" },
  NAVIGATE_TRACKER: { action: "open_calendar", route: "/tracker" },
  NAVIGATE_SOS: { action: "open_sos", route: "/sos" },
  NAVIGATE_SETTINGS: { action: "open_settings", route: "/settings" },
  NAVIGATE_ADMIN: { action: "open_admin", route: "/admin/login" },
  NAVIGATE_HISTORY: { action: "open_history", route: "/history" },
  NAVIGATE_PREMIUM: { action: "open_premium", route: "/premium" },
  VOICE_SETTINGS: { action: "open_voice_settings", route: "/settings/voice" },
  WEATHER: { action: "show_weather", route: "/maps" },
  CALCULATE_90_180: { action: "navigate", route: "/tracker" },
  OPEN_VACANCIES_LIST: { action: "open_jobs", route: "/jobs-test" },
};

function buildRouteWithParams(intent: IntentType, entities: ExtractedEntities, baseRoute: string): string {
  const params = new URLSearchParams();

  if (intent === "MAP_SEARCH") {
    if (entities.textObject) params.set("search", entities.textObject);
    else if (entities.placeDisplay?.ru) params.set("search", entities.placeDisplay.ru);
    else if (entities.orgName) params.set("search", entities.orgName);
    else if (entities.city) params.set("search", entities.city);
  } else if (intent === "MAP_ROUTE") {
    if (entities.routeFromTo?.from) params.set("from", entities.routeFromTo.from);
    if (entities.routeFromTo?.to) params.set("to", entities.routeFromTo.to);
    if (entities.city && !entities.routeFromTo?.from) params.set("from", entities.city);
  } else if (intent === "JOB_SEARCH") {
    if (entities.profession) params.set("query", entities.profession);
    else if (entities.textObject) params.set("query", entities.textObject);
    if (entities.city) params.set("city", entities.city);
  } else if (intent === "OCR_TRANSLATE") {
    if (entities.documentType) params.set("type", entities.documentType);
    if (entities.textObject) params.set("text", entities.textObject);
  } else if (intent === "EMPLOYER_CHECK" || intent === "DOCUMENT_CHECK") {
    if (entities.orgName) params.set("org", entities.orgName);
    if (entities.textObject) params.set("query", entities.textObject);
  } else if (intent === "WEATHER") {
    if (entities.city) params.set("city", entities.city);
  } else if (intent === "AI_CHAT") {
    if (entities.textObject) params.set("q", entities.textObject);
  }

  const query = params.toString();
  return query ? `${baseRoute}?${query}` : baseRoute;
}

// ────────────────────────────────────────────────────────────────────
// Главная функция — распознавание намерения
// ────────────────────────────────────────────────────────────────────

export interface RecognizeOptions {
  /** Минимальная confidence для возврата результата (0..1) */
  minConfidence?: number;
}

/**
 * Распознаёт намерение из текста.
 *
 * @param text — входной текст (сообщение чата или STT-результат)
 * @param appLang — язык приложения (используется как fallback)
 * @returns IntentResult или null, если ничего не подошло
 */
export function recognizeIntent(
  text: string,
  appLang: "ru" | "uz" | "en" = "ru",
  options: RecognizeOptions = {}
): IntentResult | null {
  if (!text || text.trim().length < 2) return null;
  const rawText = text.trim();
  const normalized = normalizeInput(rawText);
  const language = detectLanguage(normalized, rawText);
  const { minConfidence = 0.2 } = options;

  // Перебираем правила и ищем лучшее совпадение
  let best: { rule: IntentRule; score: number } | null = null;

  for (const rule of INTENT_RULES) {
    if (!rule.lang.includes(language) && !rule.lang.includes(appLang)) continue;

    let matches = 0;
    for (const pattern of rule.patterns) {
      if (getRegex(pattern).test(normalized)) matches++;
    }
    if (matches === 0) continue;

    // Скоринг:
    //  - baseWeight (приоритет правила)
    //  - доля совпавших паттернов
    //  - бонус за совпадение с detectedLang
    //  - длинное правило = более специфичное
    const matchRatio = matches / rule.patterns.length;
    const langBonus = rule.lang.includes(language) ? 0.2 : 0;
    const specificity = Math.min(0.2, matches * 0.05);
    const score = rule.baseWeight + matchRatio * 0.4 + langBonus + specificity;

    if (!best || score > best.score) {
      best = { rule, score };
    }
  }

  if (!best || best.score < minConfidence) return null;

  // Извлекаем сущности
  const entities = extractAllEntities(rawText, normalized, best.rule, best.rule.intent);

  // Финальный confidence: учитываем извлечённые сущности
  let confidence = best.score;
  if (entities.city) confidence += 0.05;
  if (entities.profession) confidence += 0.1;
  if (entities.placeCategory) confidence += 0.1;
  if (entities.orgName) confidence += 0.1;
  if (entities.routeFromTo?.to) confidence += 0.1;
  if (entities.textObject && entities.textObject.length >= 3) confidence += 0.05;
  confidence = Math.min(1, confidence);

  // Получаем action и route
  const mapping = ACTION_MAP[best.rule.intent];
  const action = mapping.action;
  const route = buildRouteWithParams(best.rule.intent, entities, mapping.route);

  // Собираем короткий reply
  const reply = buildReply(best.rule.intent, entities, language);

  return {
    intent: best.rule.intent,
    confidence,
    language,
    entities,
    reply,
    action,
    route,
    rawText,
    normalizedText: normalized,
  };
}

/**
 * Быстрая проверка: содержит ли текст ключевые слова для какого-то intent.
 * Используется как pre-check перед полным recognizeIntent (например, в чате).
 */
export function hasIntentKeyword(text: string): boolean {
  const normalized = normalizeInput(text);
  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      if (getRegex(pattern).test(normalized)) return true;
    }
  }
  return false;
}

/** Возвращает список всех intents, поддерживаемых движком. */
export function getSupportedIntents(): IntentType[] {
  return INTENT_RULES.map((r) => r.intent);
}