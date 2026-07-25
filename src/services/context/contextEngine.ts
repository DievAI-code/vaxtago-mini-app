/**
 * ContextEngine — публичный API для управления контекстом диалога.
 *
 * Использование:
 *
 *   import { contextEngine } from "@/services/context";
 *
 *   const resolution = contextEngine.process(
 *     text,           // сообщение пользователя
 *     "session-123",  // ID сессии
 *     "ru"            // язык приложения (fallback)
 *   );
 *
 *   if (resolution.command === "save") {
 *     // пользователь сказал "Сохрани" → выполнить сохранение
 *   }
 *   navigate(resolution.route);
 *
 * Класс также доступен для создания независимых экземпляров
 * (для тестов или multi-tenant сценариев).
 */

import type { Lang } from "@/i18n";
import { recognizeIntent, type IntentResult } from "@/services/intent";
import type { SessionContext } from "./sessionContext";
import {
  DEFAULT_TTL_MS,
  applyResolutionToContext,
  shouldReset,
} from "./sessionContext";
import { ContextStore, getContextStore } from "./contextStore";
import { ContextResolver } from "./contextResolver";
import type { ContextResolution, ContextResolutionUpdate } from "./types";

export class ContextEngine {
  private readonly store: ContextStore;
  private readonly resolver: ContextResolver;
  private readonly ttlMs: number;

  constructor(opts?: { store?: ContextStore; ttlMs?: number; resolver?: ContextResolver }) {
    this.store = opts?.store ?? getContextStore();
    this.resolver = opts?.resolver ?? new ContextResolver();
    this.ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  }

  /**
   * Обработать сообщение пользователя в контексте сессии.
   *
   * @param text   — сырой текст сообщения
   * @param sessionId — ID сессии
   * @param appLang — язык приложения (fallback)
   * @param userId — опциональный ID пользователя
   */
  process(
    text: string,
    sessionId: string,
    appLang: Lang = "ru",
    userId?: string,
  ): ContextResolution {
    // 1. Получить или создать контекст (создаст новый, если истёк)
    const { ctx, created } = this.store.getOrCreate(sessionId, appLang, userId, this.ttlMs);

    // 2. Если контекст был сброшен из-за TTL — отметить
    if (created && ctx.contextExpiredOnce) {
      // fallthrough; flag выставлен в getOrCreate
    }

    // 3. Распознать намерение
    const intentResult = recognizeIntent(text, appLang);

    // 4. Объединить с контекстом
    const resolution = this.resolver.resolve(text, ctx, intentResult, appLang);
    resolution.contextExpired = created && ctx.contextExpiredOnce;

    // 5. Обновить контекст
    this.applyUpdate(sessionId, resolution, intentResult, appLang);

    return resolution;
  }

  /**
   * Применить resolution к контексту (обновление lastIntent/Entities/etc).
   * Вызывается автоматически из process(), но доступен публично
   * для UI, которое хочет вручную зафиксировать действия (например,
   * "пользователь сохранил вакансию" → update lastJobQuery).
   */
  applyUpdate(
    sessionId: string,
    resolution: ContextResolution,
    _intentResult: IntentResult | null,
    _appLang: Lang,
  ): void {
    const existing = this.store.get(sessionId);
    if (!existing) return;

    const update: ContextResolutionUpdate = {
      intent: resolution.intent,
      action: resolution.action,
      route: resolution.route,
      queryText: resolution.combinedText,
      pendingFragment: resolution.pendingFragment,
      city: resolution.entities.city,
      cityCountry: resolution.entities.cityCountry,
      profession: resolution.entities.profession,
      orgName: resolution.entities.orgName,
      address: resolution.entities.textObject,
      language: resolution.language,
    };

    // Если это save/share/etc команда с найденным контекстом — обновляем
    // соответствующий last*Snapshot, чтобы следующий "Поделись" тоже
    // работал корректно.
    if (resolution.isContinuation) {
      if (existing.lastPlace && (resolution.intent === "MAP_SEARCH" || resolution.intent === "MAP_ROUTE")) {
        update.place = existing.lastPlace;
      }
      if (existing.lastDocument && resolution.intent === "OCR_TRANSLATE") {
        update.document = existing.lastDocument;
      }
      if (existing.lastTranslation) {
        update.translation = existing.lastTranslation;
      }
    }

    const next = applyResolutionToContext(existing, update);
    this.store.set(sessionId, next);
  }

  /**
   * Зафиксировать результат поиска (например, найденный объект на карте).
   * UI вызывает после получения результата от сервера.
   */
  recordMapObject(
    sessionId: string,
    obj: {
      name: string;
      category?: string;
      city?: string;
      address?: string;
      coords?: [number, number];
      source?: string;
    },
  ): void {
    const existing = this.store.get(sessionId);
    if (!existing) return;
    this.store.set(sessionId, {
      ...existing,
      lastPlace: obj,
      lastMessageAt: Date.now(),
    });
  }

  /** Зафиксировать результат OCR/перевода */
  recordDocument(
    sessionId: string,
    doc: {
      type: "passport" | "patent" | "migration_card" | "registration" | "contract" | "general";
      originalText: string;
      translatedText: string;
      sourceLanguage: string;
      targetLanguage: string;
    },
  ): void {
    const existing = this.store.get(sessionId);
    if (!existing) return;
    this.store.set(sessionId, {
      ...existing,
      lastDocument: doc,
      lastTranslation: {
        sourceLanguage: doc.sourceLanguage,
        targetLanguage: doc.targetLanguage,
        originalText: doc.originalText,
        translatedText: doc.translatedText,
      },
      lastMessageAt: Date.now(),
    });
  }

  /** Зафиксировать результат поиска вакансий */
  recordJobSearch(
    sessionId: string,
    job: {
      query?: string;
      city?: string;
      profession?: string;
      salaryFrom?: number;
      vakhta?: boolean;
      housing?: boolean;
      experience?: string;
      resultsCount?: number;
      resultIds?: string[];
    },
  ): void {
    const existing = this.store.get(sessionId);
    if (!existing) return;
    this.store.set(sessionId, {
      ...existing,
      lastJobQuery: job,
      lastMessageAt: Date.now(),
    });
  }

  /** Зафиксировать последний ответ AI */
  recordAIAnswer(sessionId: string, answer: string): void {
    const existing = this.store.get(sessionId);
    if (!existing) return;
    this.store.set(sessionId, {
      ...existing,
      lastAIAnswer: answer,
      lastMessageAt: Date.now(),
    });
  }

  /** Получить текущий снимок контекста (read-only копию) */
  getContext(sessionId: string): SessionContext | null {
    return this.store.get(sessionId);
  }

  /** Получить историю тем (копию) */
  getHistory(sessionId: string) {
    return this.store.get(sessionId)?.topicHistory.slice() ?? [];
  }

  /** Полностью сбросить сессию */
  resetSession(sessionId: string): void {
    this.store.reset(sessionId);
  }

  /** Сбросить несколько сессий (logout, чистка) */
  resetSessions(sessionIds: string[]): void {
    for (const id of sessionIds) {
      this.store.reset(id);
    }
  }

  /** Полная очистка (logout) */
  resetAll(): void {
    for (const id of this.store.list()) {
      this.store.reset(id);
    }
  }

  /** Подсчитать количество активных сессий */
  activeSessionCount(): number {
    return this.store.size();
  }

  /** Проверить, истёк ли контекст (для UI-плашки) */
  isContextExpired(sessionId: string): boolean {
    const ctx = this.store.get(sessionId);
    if (!ctx) return true;
    return shouldReset(ctx, Date.now(), this.ttlMs);
  }
}

// ────────────────────────────────────────────────────────────────────
// Singleton
// ────────────────────────────────────────────────────────────────────

let _engine: ContextEngine | null = null;

/** Получить singleton engine. Безопасно вызывать из любого места. */
export function getContextEngine(): ContextEngine {
  if (!_engine) {
    _engine = new ContextEngine();
  }
  return _engine;
}

/** Singleton (default export) */
export const contextEngine: ContextEngine = getContextEngine();

/** Сбросить singleton engine (для тестов) */
export function __resetContextEngineForTests(): void {
  _engine = null;
}