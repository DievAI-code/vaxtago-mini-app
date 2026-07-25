/**
 * In-memory хранилище сессий с опциональной sessionStorage-персистентностью.
 *
 * Структура: Map<sessionId, SessionContext>
 *
 * На проде желательно заменить на Redis / IndexedDB / Supabase, но для
 * single-tab диалога sessionStorage достаточно — при перезагрузке страницы
 * контекст восстанавливается, при закрытии вкладки — сбрасывается.
 *
 * Все методы безопасны для вызова из любого места приложения.
 */

import type { SessionContext } from "./sessionContext";
import { createEmptyContext, DEFAULT_TTL_MS, isExpired, type Lang } from "./sessionContext";
import type { Lang as LangType } from "@/i18n";

const STORAGE_KEY = "vaqta_context_store_v1";
const STORAGE_VERSION = 1;

interface StorageShape {
  v: number;
  items: Record<string, SerializedSession>;
}

interface SerializedSession {
  c: SessionContext;
}

class ContextStore {
  private readonly sessions = new Map<string, SessionContext>();
  /** Использовать sessionStorage для персистентности (per-tab) */
  private readonly useStorage: boolean;
  /** Периодический purge флаг */
  private lastPurgeAt = 0;
  /** ID для периодической очистки */
  private purgeTimer: ReturnType<typeof setInterval> | null = null;

  constructor(opts?: { useStorage?: boolean; autoPurgeMs?: number }) {
    this.useStorage = opts?.useStorage !== false;
    if (this.useStorage && typeof window !== "undefined") {
      this.loadFromStorage();
    }
    // Периодическая очистка просроченных сессий
    const autoPurgeMs = opts?.autoPurgeMs ?? 60_000;
    if (typeof window !== "undefined" && autoPurgeMs > 0) {
      this.purgeTimer = setInterval(() => this.purgeExpired(autoPurgeMs), autoPurgeMs);
    }
  }

  /** Уничтожить таймер (для тестов / SSR) */
  destroy(): void {
    if (this.purgeTimer) {
      clearInterval(this.purgeTimer);
      this.purgeTimer = null;
    }
  }

  // ─── Базовые операции ───

  get(sessionId: string): SessionContext | null {
    return this.sessions.get(sessionId) ?? null;
  }

  set(sessionId: string, ctx: SessionContext): void {
    this.sessions.set(sessionId, ctx);
    if (this.useStorage) {
      this.persistToStorage();
    }
  }

  delete(sessionId: string): boolean {
    const ok = this.sessions.delete(sessionId);
    if (ok && this.useStorage) {
      this.persistToStorage();
    }
    return ok;
  }

  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  size(): number {
    return this.sessions.size;
  }

  list(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Получить или создать контекст. Если контекст истёк — создаёт новый.
   * Возвращает { ctx, created: boolean }.
   */
  getOrCreate(
    sessionId: string,
    language: LangType = "ru",
    userId?: string,
    ttlMs: number = DEFAULT_TTL_MS,
  ): { ctx: SessionContext; created: boolean } {
    const existing = this.sessions.get(sessionId);
    if (existing && !isExpired(existing, Date.now(), ttlMs)) {
      return { ctx: existing, created: false };
    }
    const created = createEmptyContext(sessionId, language, userId);
    if (existing) {
      created.contextExpiredOnce = true;
      created.topicHistory = existing.topicHistory; // сохраняем историю тем
    }
    this.sessions.set(sessionId, created);
    if (this.useStorage) this.persistToStorage();
    return { ctx: created, created: true };
  }

  /**
   * Полностью очистить сессию (сброс).
   * Вызывается при ручном сбросе пользователем или при logout.
   */
  reset(sessionId: string): void {
    this.sessions.delete(sessionId);
    if (this.useStorage) this.persistToStorage();
  }

  /**
   * Удалить все истёкшие сессии. Возвращает количество удалённых.
   */
  purgeExpired(ttlMs: number = DEFAULT_TTL_MS): number {
    const now = Date.now();
    let removed = 0;
    for (const [id, ctx] of this.sessions) {
      if (isExpired(ctx, now, ttlMs)) {
        this.sessions.delete(id);
        removed++;
      }
    }
    if (removed > 0 && this.useStorage) {
      this.persistToStorage();
    }
    this.lastPurgeAt = now;
    return removed;
  }

  // ─── Persistence ───

  private persistToStorage(): void {
    if (typeof window === "undefined") return;
    try {
      const items: Record<string, SerializedSession> = {};
      for (const [id, ctx] of this.sessions) {
        items[id] = { c: ctx };
      }
      const data: StorageShape = { v: STORAGE_VERSION, items };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Переполнение квоты sessionStorage — игнорируем
    }
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StorageShape;
      if (parsed.v !== STORAGE_VERSION) return;
      this.sessions.clear();
      for (const [id, wrap] of Object.entries(parsed.items)) {
        if (wrap?.c) this.sessions.set(id, wrap.c);
      }
    } catch {
      // Битый JSON — игнорируем
    }
  }
}

// ────────────────────────────────────────────────────────────────────
// Singleton
// ────────────────────────────────────────────────────────────────────

let _instance: ContextStore | null = null;

/** Получить или создать singleton. Безопасно вызывать из любого места. */
export function getContextStore(): ContextStore {
  if (!_instance) {
    _instance = new ContextStore();
  }
  return _instance;
}

/** Сбросить singleton (для тестов) */
export function __resetContextStoreForTests(): void {
  if (_instance) _instance.destroy();
  _instance = null;
}