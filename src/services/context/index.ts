/**
 * Barrel-экспорт Context Engine.
 *
 * Импортируйте из "@/services/context" вместо вложенных путей.
 *
 *   import { contextEngine, type ContextResolution } from "@/services/context";
 *
 *   const resolution = contextEngine.process(text, sessionId, "ru");
 *   navigate(resolution.route);
 */

export {
  contextEngine,
  ContextEngine,
  getContextEngine,
} from "./contextEngine";

export type { ContextResolution, ContextResolutionUpdate, ContextCommand } from "./types";

export {
  getContextStore,
  __resetContextStoreForTests,
  ContextStore,
} from "./contextStore";

export { ContextResolver } from "./contextResolver";

export { ConversationMemory } from "./conversationMemory";

export {
  createEmptyContext,
  isExpired,
  isStale,
  shouldReset,
  isSameFamily,
  isNavigationIntent,
  isAIFollowUpIntent,
  getTopicFamily,
  snapshotTopic,
  applyResolutionToContext,
  buildEntityFromContext,
  getRecentTopics,
  getLastTopic,
  hasTopicAbout,
  topicCount,
  DEFAULT_TTL_MS,
  FRAGMENT_WINDOW_MS,
  HISTORY_LIMIT,
} from "./sessionContext";

export type {
  SessionContext,
  TopicSnapshot,
  JobSearchSnapshot,
  MapObjectSnapshot,
  DocumentSnapshot,
  TranslationSnapshot,
} from "./sessionContext";