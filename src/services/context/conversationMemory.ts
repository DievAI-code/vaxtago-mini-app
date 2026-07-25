/**
 * Менеджер истории тем (topic history).
 *
 * Хранит стек TopicSnapshot — снимков контекста, "забытых" при явной
 * смене темы. Используется для отката ("вернуться к прошлому поиску")
 * и для UI ("недавно обсуждали: ...").
 *
 * Не имеет собственного состояния — работает поверх SessionContext.
 */

import type { Lang } from "@/i18n";
import type { ExtractedEntities, IntentType } from "@/services/intent";
import type { SessionContext, TopicSnapshot } from "./sessionContext";
import { HISTORY_LIMIT, snapshotTopic } from "./sessionContext";

export class ConversationMemory {
  /**
   * Добавить текущую тему в историю (вызывать при явной смене темы).
   * Если стек переполнен — удалить самую старую запись.
   */
  push(ctx: SessionContext, intent: IntentType, entities: ExtractedEntities): TopicSnapshot {
    const snap = snapshotTopic(ctx, intent, entities);
    const history = [snap, ...ctx.topicHistory];
    if (history.length > HISTORY_LIMIT) {
      history.length = HISTORY_LIMIT;
    }
    ctx.topicHistory = history;
    return snap;
  }

  /**
   * Получить всю историю (копию массива).
   */
  list(ctx: SessionContext): TopicSnapshot[] {
    return ctx.topicHistory.slice();
  }

  /**
   * Получить последнюю (самую свежую) тему.
   */
  last(ctx: SessionContext): TopicSnapshot | null {
    return ctx.topicHistory[0] ?? null;
  }

  /**
   * Очистить историю.
   */
  clear(ctx: SessionContext): void {
    ctx.topicHistory = [];
  }

  /**
   * Удалить конкретную тему по индексу.
   */
  removeAt(ctx: SessionContext, index: number): boolean {
    if (index < 0 || index >= ctx.topicHistory.length) return false;
    ctx.topicHistory = ctx.topicHistory.filter((_, i) => i !== index);
    return true;
  }

  /**
   * Получить N последних тем.
   */
  recent(ctx: SessionContext, n: number = 5): TopicSnapshot[] {
    return ctx.topicHistory.slice(0, Math.max(0, n));
  }

  /**
   * Получить темы только по семейству.
   */
  byFamily(ctx: SessionContext, family: string): TopicSnapshot[] {
    const { getTopicFamily } = require("./sessionContext") as typeof import("./sessionContext");
    return ctx.topicHistory.filter((t) => getTopicFamily(t.intent) === family);
  }

  /**
   * Подсчитать темы по семейству.
   */
  countByFamily(ctx: SessionContext, family: string): number {
    const { getTopicFamily } = require("./sessionContext") as typeof import("./sessionContext");
    return ctx.topicHistory.filter((t) => getTopicFamily(t.intent) === family).length;
  }

  /**
   * Восстановить последнюю тему из истории (если есть).
   * Удаляет её из истории и возвращает снимок.
   */
  pop(ctx: SessionContext): TopicSnapshot | null {
    if (ctx.topicHistory.length === 0) return null;
    const [first, ...rest] = ctx.topicHistory;
    ctx.topicHistory = rest;
    return first ?? null;
  }
}

// ────────────────────────────────────────────────────────────────────
// Утилиты-помощники (чистые функции)
// ────────────────────────────────────────────────────────────────────

/** Получить последние N тем */
export function getRecentTopics(ctx: SessionContext, n: number = 5): TopicSnapshot[] {
  return ctx.topicHistory.slice(0, n);
}

/** Получить последнюю тему без модификации */
export function getLastTopic(ctx: SessionContext): TopicSnapshot | null {
  return ctx.topicHistory[0] ?? null;
}

/** Проверить, обсуждался ли уже данный семейство (JOB / MAP / DOC) */
export function hasTopicAbout(ctx: SessionContext, family: string): boolean {
  const { getTopicFamily } = require("./sessionContext") as typeof import("./sessionContext");
  return ctx.topicHistory.some((t) => getTopicFamily(t.intent) === family);
}

/** Получить количество тем в истории */
export function topicCount(ctx: SessionContext): number {
  return ctx.topicHistory.length;
}