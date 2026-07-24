"use client";

export type AIActionType = "GENERAL_CHAT" | "MAP_SEARCH" | "JOB_SEARCH" | "TRANSLATE" | "DOCUMENT_SCAN";

export interface AIActionResponse {
  action: AIActionType;
  query?: string;
  originalMessage: string;
}

const ALIASES: Record<string, string> = {
  "епрс": "Ермаковское предприятие по ремонту скважин",
  "ерс": "Ермаковское предприятие по ремонту скважин",
  "жд": "Железнодорожный вокзал",
  "мфц": "Многофункциональный центр",
  "мвд": "Управление по вопросам миграции",
};

/**
 * Smartly detects user intent and expands aliases
 */
export function parseAIIntent(message: string): AIActionResponse {
  const low = message.toLowerCase().trim();
  
  // 1. Detect Intent
  let action: AIActionType = "GENERAL_CHAT";
  if (/найди|где|как доехать|адрес|вокзал|аэропорт/i.test(low)) action = "MAP_SEARCH";
  else if (/иш|работа|ваканс/i.test(low)) action = "JOB_SEARCH";
  else if (/переведи|таржима/i.test(low)) action = "TRANSLATE";
  else if (/скан|фото/i.test(low)) action = "DOCUMENT_SCAN";

  // 2. Expand Aliases
  let query = low;
  for (const [alias, formal] of Object.entries(ALIASES)) {
    if (low.includes(alias)) {
      query = low.replace(alias, formal);
      break;
    }
  }

  return {
    action,
    query,
    originalMessage: message
  };
}