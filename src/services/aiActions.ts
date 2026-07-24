"use client";

/**
 * Supported AI Action Types for VAQTA AI
 */
export type AIActionType =
  | "chat"
  | "map_search"
  | "route"
  | "job_search"
  | "translate_photo"
  | "document"
  | "unknown";

/**
 * Interface for interactive response chips
 */
export interface ActionChip {
  id: string;
  title: string;
  icon?: string;
  value: string;
}

/**
 * Result of the AI Action detection
 */
export interface AIActionResult {
  type: AIActionType;
  query?: string;
  message?: string;
  chips?: ActionChip[];
}

/**
 * Detects the user's intent and extracts relevant search queries
 * Handles Russian, Uzbek (Latin/Cyrillic), and English keywords.
 */
export function detectAIAction(message: string): AIActionResult {
  const low = message.toLowerCase().trim();

  // 1. Photo Translation Intent
  if (/переведи фото|распознай|таржима|скан|фото|photo|translate/i.test(low) && 
      !/адрес|вокзал|работа/i.test(low)) {
    return { type: "translate_photo" };
  }

  // 2. Route Building Intent
  if (/маршрут|как доехать|как добраться|marshrut|yol|yo'l|доехать/i.test(low)) {
    const query = low
      .replace(/построй маршрут до|маршрут до|как доехать до|как добраться до/gi, "")
      .trim();
    return { type: "route", query: query || undefined };
  }

  // 3. Map / Location Search Intent
  if (/найди|где|покажи|вокзал|аэропорт|метро|vokzal|vokzali|aeroport|manzil|адрес/i.test(low)) {
    const query = low
      .replace(/найди|где находится|покажи на карте|manzilini top/gi, "")
      .trim();
    return { type: "map_search", query: query || low };
  }

  // 4. Job Search Intent
  if (/иш|работа|ваканс|ish|ishlash|сварщик|водитель|разнорабочий|нужна работа/i.test(low)) {
    const query = low
      .replace(/найди работу|ищу работу|иш керак|вакансиялар/gi, "")
      .trim();
    return { type: "job_search", query: query || low };
  }

  // 5. Document / Legal Help Intent
  if (/документ|патент|договор|регистрац|ҳужжат|hujjat|patent/i.test(low)) {
    return { type: "document" };
  }

  // Default: General Chat
  return { type: "chat" };
}