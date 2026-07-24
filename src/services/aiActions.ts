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

export interface ActionChip {
  id: string;
  title: string;
  icon?: string;
  value: string;
}

export interface AIActionResult {
  type: AIActionType;
  query?: string;
  from?: string;
  to?: string;
  message?: string;
  chips?: ActionChip[];
}

const ALIASES: Record<string, string> = {
  "епрс": "Ермаковское предприятие по ремонту скважин",
  "жд": "Железнодорожный вокзал",
};

export function detectAIAction(message: string): AIActionResult {
  const low = message.toLowerCase().trim();

  // 1. Route Intent with From/To detection
  if (/маршрут|как доехать|как добраться|путь|дорога/i.test(low)) {
    // Regex to match "from X to Y" in Russian (от ... до ...)
    const fromToRegex = /(?:от|с|из)\s+(.+?)\s+(?:до|в|на)\s+(.+)/i;
    const match = low.match(fromToRegex);
    
    if (match) {
      return { 
        type: "route", 
        from: match[1].trim(), 
        to: match[2].trim() 
      };
    }

    const toOnly = low.replace(/построй маршрут до|маршрут до|как доехать до|как добраться до/gi, "").trim();
    return { type: "route", to: toOnly || undefined };
  }

  // 2. Map Search
  if (/найди|где|покажи|вокзал|аэропорт|метро|адрес/i.test(low)) {
    let query = low.replace(/найди|где находится|покажи на карте/gi, "").trim();
    // Simple alias expansion
    for (const [a, f] of Object.entries(ALIASES)) {
      if (query.includes(a)) query = query.replace(a, f);
    }
    return { type: "map_search", query: query || low };
  }

  // 3. Others...
  if (/иш|работа|ваканс/i.test(low)) return { type: "job_search", query: low };
  if (/переведи фото|распознай|таржима|скан|фото/i.test(low)) return { type: "translate_photo" };

  return { type: "chat" };
}