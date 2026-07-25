/**
 * Типы и чистые функции для работы с SessionContext.
 *
 * SessionContext — это in-memory снимок состояния диалога пользователя:
 * - последнее намерение, маршрут, действие
 * - извлечённые сущности (город, профессия, организация, объект на карте,
 *   вакансия, документ, перевод, последний ответ AI)
 * - стек тем (для отката при явной смене темы)
 *
 * Никаких side-effects — все функции чистые, безопасные для тестов.
 */

import type { Lang } from "@/i18n";
import type {
  ExtractedEntities,
  IntentAction,
  IntentType,
} from "@/services/intent";

// ────────────────────────────────────────────────────────────────────
// Домен-специфичные снимки
// ────────────────────────────────────────────────────────────────────

export interface JobSearchSnapshot {
  query?: string;
  city?: string;
  profession?: string;
  salaryFrom?: number;
  vakhta?: boolean;
  housing?: boolean;
  experience?: string;
  resultsCount?: number;
  resultIds?: string[];
}

export interface MapObjectSnapshot {
  /** Каноническое имя (например, "Аптека №5") */
  name: string;
  /** Категория POI — pharmacy / hospital / mosque / bank и т.д. */
  category?: string;
  city?: string;
  address?: string;
  /** [lat, lng] — если есть */
  coords?: [number, number];
  source?: string;
}

export interface DocumentSnapshot {
  type: "passport" | "patent" | "migration_card" | "registration" | "contract" | "general";
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationSnapshot {
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
  translatedText: string;
}

// ────────────────────────────────────────────────────────────────────
// Снимок темы (для стека)
// ────────────────────────────────────────────────────────────────────

export interface TopicSnapshot {
  intent: IntentType;
  /** Ключевые сущности темы (city, profession, org, place и т.д.) */
  entities: Pick<
    ExtractedEntities,
    "city" | "cityCountry" | "profession" | "orgName" | "placeCategory" | "textObject"
  >;
  /** Краткое описание темы для логирования */
  label: string;
  at: number;
}

// ────────────────────────────────────────────────────────────────────
// Главный тип — снимок сессии
// ────────────────────────────────────────────────────────────────────

export interface SessionContext {
  /** ID сессии (генерируется вызывающим кодом) */
  sessionId: string;
  /** Опциональный ID пользователя для аналитики */
  userId?: string;
  /** Язык пользователя */
  language: Lang;

  // ─── Навигационное ядро ───
  lastIntent?: IntentType;
  lastAction?: IntentAction;
  lastRoute?: string;
  /** Полный текст последнего сообщения пользователя */
  lastQueryText?: string;
  /** Текст предыдущего неполного сообщения (для склейки фрагментов) */
  pendingFragment?: string;

  // ─── Извлечённые сущности ───
  lastCity?: string;
  lastCityCountry?: "ru" | "uz" | "kz" | "kg" | "tj";
  lastProfession?: string;
  lastOrg?: string;
  lastAddress?: string;

  // ─── Домен-специфичные снимки ───
  lastPlace?: MapObjectSnapshot;
  lastJobQuery?: JobSearchSnapshot;
  lastDocument?: DocumentSnapshot;
  lastTranslation?: TranslationSnapshot;
  lastAIAnswer?: string;

  // ─── История тем ───
  topicHistory: TopicSnapshot[];

  // ─── Мета ───
  /** Время последнего сообщения (ms) */
  lastMessageAt: number;
  /** Общее число ходов (user message) в сессии */
  totalTurns: number;
  /** Был ли контекст сброшен из-за истечения TTL */
  contextExpiredOnce: boolean;
}

// ────────────────────────────────────────────────────────────────────
// Утилиты
// ────────────────────────────────────────────────────────────────────

/** Язык безопасный: пустая строка → null */
function safe(s: string | undefined | null): string | undefined {
  if (typeof s !== "string") return undefined;
  const t = s.trim();
  return t.length ? t : undefined;
}

/** Создать пустой контекст для новой сессии */
export function createEmptyContext(
  sessionId: string,
  language: Lang = "ru",
  userId?: string,
): SessionContext {
  const now = Date.now();
  return {
    sessionId,
    userId,
    language,
    topicHistory: [],
    lastMessageAt: now,
    totalTurns: 0,
    contextExpiredOnce: false,
  };
}

/** Является ли intent навигацией (не считается сменой темы) */
export function isNavigationIntent(intent?: IntentType): boolean {
  if (!intent) return false;
  return intent.startsWith("NAVIGATE_") || intent === "VOICE_SETTINGS";
}

/** Является ли intent AI-чатом / общим вопросом */
export function isAIFollowUpIntent(intent?: IntentType): boolean {
  if (!intent) return false;
  return intent === "AI_CHAT" || intent === "WEATHER" || intent === "CALCULATE_90_180";
}

// ────────────────────────────────────────────────────────────────────
// Семейства тем (topic family)
// ────────────────────────────────────────────────────────────────────

const TOPIC_FAMILIES: Array<{ name: string; intents: IntentType[] }> = [
  { name: "JOB", intents: ["JOB_SEARCH", "OPEN_VACANCIES_LIST"] },
  { name: "MAP", intents: ["MAP_SEARCH", "MAP_ROUTE"] },
  { name: "DOC", intents: ["OCR_TRANSLATE", "DOCUMENT_CHECK"] },
  { name: "EMPLOYER", intents: ["EMPLOYER_CHECK"] },
  { name: "AI", intents: ["AI_CHAT", "WEATHER", "CALCULATE_90_180", "VOICE_SETTINGS"] },
  { name: "SOS", intents: ["SOS"] },
  { name: "PREMIUM", intents: ["PREMIUM"] },
  { name: "ADMIN", intents: ["NAVIGATE_ADMIN"] },
  { name: "PROFILE", intents: ["NAVIGATE_PROFILE", "NAVIGATE_HISTORY"] },
  { name: "SETTINGS", intents: ["NAVIGATE_SETTINGS", "NAVIGATE_HOME"] },
];

const INTENT_TO_FAMILY = new Map<IntentType, string>();
for (const fam of TOPIC_FAMILIES) {
  for (const intent of fam.intents) {
    INTENT_TO_FAMILY.set(intent, fam.name);
  }
}

/** Возвращает имя семейства (JOB / MAP / DOC / ...) или null */
export function getTopicFamily(intent?: IntentType): string | null {
  if (!intent) return null;
  return INTENT_TO_FAMILY.get(intent) ?? null;
}

/** Одинаковые ли семейства у двух intents? */
export function isSameFamily(a?: IntentType, b?: IntentType): boolean {
  if (!a || !b) return false;
  return getTopicFamily(a) === getTopicFamily(b);
}

// ────────────────────────────────────────────────────────────────────
// TTL / Stale
// ────────────────────────────────────────────────────────────────────

/** Истёк ли контекст (TTL от последнего сообщения) */
export function isExpired(
  ctx: SessionContext,
  now: number = Date.now(),
  ttlMs: number = DEFAULT_TTL_MS,
): boolean {
  return now - ctx.lastMessageAt > ttlMs;
}

/** "Устарел" ли контекст (мягкий критерий) — прошло > 5 минут */
export function isStale(
  ctx: SessionContext,
  now: number = Date.now(),
  staleMs: number = 5 * 60 * 1000,
): boolean {
  return now - ctx.lastMessageAt > staleMs;
}

/** Проверка, не пора ли сбросить контекст */
export function shouldReset(
  ctx: SessionContext,
  now: number = Date.now(),
  ttlMs: number = DEFAULT_TTL_MS,
): boolean {
  return isExpired(ctx, now, ttlMs);
}

// ────────────────────────────────────────────────────────────────────
// Снимки
// ────────────────────────────────────────────────────────────────────

/** Сделать снимок текущей темы для стека истории */
export function snapshotTopic(
  ctx: SessionContext,
  intent: IntentType,
  entities: ExtractedEntities,
): TopicSnapshot {
  const parts: string[] = [];
  if (entities.profession) parts.push(entities.profession);
  if (entities.city) parts.push(entities.city);
  if (entities.orgName) parts.push(entities.orgName);
  if (entities.placeCategory) parts.push(entities.placeCategory);
  if (entities.textObject) parts.push(entities.textObject);
  if (intent === "JOB_SEARCH" || intent === "OPEN_VACANCIES_LIST") parts.unshift("вакансии");
  if (intent === "MAP_SEARCH" || intent === "MAP_ROUTE") parts.unshift("карта");
  if (intent === "OCR_TRANSLATE") parts.unshift("OCR");
  if (intent === "DOCUMENT_CHECK") parts.unshift("документ");
  if (intent === "EMPLOYER_CHECK") parts.unshift("работодатель");

  const label = parts.length > 0 ? parts.join(" · ") : intent;
  return {
    intent,
    entities: {
      city: entities.city,
      cityCountry: entities.cityCountry,
      profession: entities.profession,
      orgName: entities.orgName,
      placeCategory: entities.placeCategory,
      textObject: entities.textObject,
    },
    label: label.slice(0, 120),
    at: Date.now(),
  };
}

// ────────────────────────────────────────────────────────────────────
// Обновление контекста
// ────────────────────────────────────────────────────────────────────

/** Слить одну сущность в контекст (если ещё не задана) */
function setIfMissing<T>(prev: T | undefined, next: T | undefined): T | undefined {
  if (prev !== undefined && prev !== null && prev !== "") return prev;
  if (next === undefined || next === null || next === "") return prev;
  return next;
}

/** Обновить контекст на основе нового resolution. Возвращает новый объект. */
export function applyResolutionToContext(
  ctx: SessionContext,
  update: {
    intent?: IntentType;
    action?: IntentAction;
    route?: string;
    queryText?: string;
    pendingFragment?: string;
    city?: string;
    cityCountry?: "ru" | "uz" | "kz" | "kg" | "tj";
    profession?: string;
    orgName?: string;
    address?: string;
    place?: MapObjectSnapshot;
    jobQuery?: JobSearchSnapshot;
    document?: DocumentSnapshot;
    translation?: TranslationSnapshot;
    aiAnswer?: string;
    language?: Lang;
    now?: number;
  },
): SessionContext {
  const now = update.now ?? Date.now();
  const newLang = update.language ?? ctx.language;

  return {
    ...ctx,
    language: newLang,
    lastIntent: update.intent ?? ctx.lastIntent,
    lastAction: update.action ?? ctx.lastAction,
    lastRoute: update.route ?? ctx.lastRoute,
    lastQueryText: update.queryText ?? ctx.lastQueryText,
    pendingFragment: update.pendingFragment,

    lastCity: setIfMissing(ctx.lastCity, update.city),
    lastCityCountry: setIfMissing(ctx.lastCityCountry, update.cityCountry),
    lastProfession: setIfMissing(ctx.lastProfession, update.profession),
    lastOrg: setIfMissing(ctx.lastOrg, update.orgName),
    lastAddress: setIfMissing(ctx.lastAddress, update.address),

    lastPlace: update.place ?? ctx.lastPlace,
    lastJobQuery: update.jobQuery ?? ctx.lastJobQuery,
    lastDocument: update.document ?? ctx.lastDocument,
    lastTranslation: update.translation ?? ctx.lastTranslation,
    lastAIAnswer: update.aiAnswer ?? ctx.lastAIAnswer,

    lastMessageAt: now,
    totalTurns: ctx.totalTurns + 1,
  };
}

/** Построить ExtractedEntities, fallback'нувшись на контекст. */
export function buildEntityFromContext(
  ctx: SessionContext,
  current: ExtractedEntities,
): ExtractedEntities {
  return {
    city: current.city ?? ctx.lastCity,
    cityCountry: current.cityCountry ?? ctx.lastCityCountry,
    profession: current.profession ?? ctx.lastProfession,
    orgName: current.orgName ?? ctx.lastOrg,
    placeCategory: current.placeCategory ?? (ctx.lastPlace?.category as ExtractedEntities["placeCategory"]),
    placeDisplay: current.placeDisplay,
    routeFromTo: current.routeFromTo ?? (ctx.lastRoute ? undefined : undefined),
    textObject: current.textObject,
    documentType: current.documentType,
  };
}

// ────────────────────────────────────────────────────────────────────
// Константы
// ────────────────────────────────────────────────────────────────────

export const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 минут
export const FRAGMENT_WINDOW_MS = 12_000; // 12 секунд на склейку фрагментов
export const HISTORY_LIMIT = 20; // максимум тем в стеке