"use client";

import { detectIntent } from "@/lib/aiRouter";

export type AIActionType =
  | "chat"
  | "map_search"
  | "route"
  | "job_search"
  | "translate_photo"
  | "document"
  | "unknown";

export interface ActionChip {
  id: string;
  title: string;
  icon?: string;
  value: string;
}

export interface AIActionResponse {
  action: AIActionType;
  query?: string;
  from?: string;
  to?: string;
  message?: string;
  chips?: ActionChip[];
}

const TYPE_MAP: Record<string, AIActionType> = {
  GENERAL_CHAT: "chat",
  MAP_SEARCH: "map_search",
  MAP_ROUTE: "route",
  JOB_SEARCH: "job_search",
  OCR_TRANSLATE: "translate_photo",
  DOCUMENT_HELP: "document",
  LEGAL_HELP: "document",
  MIGRATION_HELP: "document",
  EMPLOYER_CHECK: "unknown",
};

export function detectAIAction(message: string): AIActionResponse {
  const intent = detectIntent(message);

  return {
    action: TYPE_MAP[intent.type] || "chat",
    query:
      intent.entities.query ||
      intent.entities.profession ||
      intent.entities.location ||
      intent.entities.to ||
      intent.originalText,
    from: intent.entities.from,
    to: intent.entities.to,
    message: intent.replyHint,
  };
}

export { detectIntent };