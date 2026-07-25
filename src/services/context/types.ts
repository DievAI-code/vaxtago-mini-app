/**
 * Общие типы для Context Engine.
 */

import type { Lang } from "@/i18n";
import type {
  DocumentSnapshot,
  MapObjectSnapshot,
  TranslationSnapshot,
} from "./sessionContext";
import type {
  ExtractedEntities,
  IntentAction,
  IntentType,
} from "@/services/intent";

/** Команды-уточнения, использующие предыдущий контекст */
export type ContextCommand =
  | "save"
  | "share"
  | "more"
  | "apply"
  | "call"
  | "open_hours"
  | "open_object"
  | "read_again"
  | "translate_back"
  | "route_to_object";

/** Результат, который возвращает ContextEngine.process() */
export interface ContextResolution {
  /** Финальное намерение (может быть предыдущим, если это continuation) */
  intent: IntentType;
  /** Объединённые сущности (новые имеют приоритет, контекст заполняет пропуски) */
  entities: ExtractedEntities;
  /** Сущности только из текущего сообщения */
  originalEntities: ExtractedEntities;
  /** Финальный маршрут с query-параметрами */
  route: string;
  /** Финальное действие */
  action: IntentAction;
  /** Текст ответа */
  reply: string;
  /** Confidence (нормализованный) */
  confidence: number;
  /** Язык */
  language: Lang;
  /** Какие поля контекста были использованы */
  contextUsed: string[];
  /** Это продолжение предыдущей темы? */
  isContinuation: boolean;
  /** Произошла ли смена темы? */
  topicChanged: boolean;
  /** Контекст истёк и был сброшен? */
  contextExpired: boolean;
  /** Специальная команда (save/share/more/etc) */
  command?: ContextCommand;
  /** Полный текст после склейки фрагментов */
  combinedText: string;
  /** Оригинальный текст сообщения */
  rawText: string;
  /** Нормализованный текст */
  normalizedText: string;
  /** Pending fragment для склейки (если есть) */
  pendingFragment?: string;
}

/** Что обновить в SessionContext после resolution */
export interface ContextResolutionUpdate {
  intent: IntentType;
  action: IntentAction;
  route: string;
  queryText?: string;
  pendingFragment?: string;
  city?: string;
  cityCountry?: "ru" | "uz" | "kz" | "kg" | "tj";
  profession?: string;
  orgName?: string;
  address?: string;
  place?: MapObjectSnapshot;
  jobQuery?: {
    query?: string;
    city?: string;
    profession?: string;
    salaryFrom?: number;
    vakhta?: boolean;
    housing?: boolean;
    experience?: string;
    resultsCount?: number;
    resultIds?: string[];
  };
  document?: DocumentSnapshot;
  translation?: TranslationSnapshot;
  aiAnswer?: string;
  language?: Lang;
}