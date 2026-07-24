"use client";

import { TravelIntent, TravelMode } from "./aiCommands";

export type { TravelIntent, TravelMode };

export interface AICommandResult {
  intent: TravelIntent;
  from?: string;
  to?: string;
  mode?: TravelMode;
}

const NORMALIZATION_MAP: Record<string, string> = {
  "жд вокзал": "Железнодорожный вокзал",
  "вокзал": "Железнодорожный вокзал",
  "ж/д вокзал": "Железнодорожный вокзал",
  "ж.д. вокзал": "Железнодорожный вокзал",
  "жд": "Железнодорожный вокзал",
  "станция": "Железнодорожный вокзал",
  "аэропорт": "Аэропорт",
};

/**
 * Normalizes specific location terms for better search results
 */
function normalizeLocation(text: string): string {
  let normalized = text.toLowerCase().trim();
  for (const [key, val] of Object.entries(NORMALIZATION_MAP)) {
    if (normalized === key || normalized.startsWith(key + " ")) {
      normalized = normalized.replace(key, val);
      break;
    }
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Splits a message into FROM and TO components based on patterns
 */
export function parseRouteRequest(message: string): AICommandResult {
  const text = message.toLowerCase().trim();
  
  // 1. Detect Mode
  let mode: TravelMode = "car";
  if (/пешком|ногами|пройти/i.test(text)) mode = "walking";
  else if (/автобус|маршрутка|метро|транспорт/i.test(text)) mode = "transport";

  // 2. Intent Detection
  const routeKeywords = ["как проехать", "как добраться", "доехать", "маршрут", "путь", "от ", " с ", " из "];
  const isRoute = routeKeywords.some(kw => text.includes(kw));

  if (!isRoute) {
    return { intent: "unknown" };
  }

  // 3. Extract FROM/TO
  let from: string | undefined;
  let to: string | undefined;

  // Pattern: "от X до Y" or "с X до Y" or "из X до Y"
  const fromToMatch = text.match(/(?:от|с|из)\s+(.+?)\s+(?:до|в|на)\s+(.+)/i);
  if (fromToMatch) {
    from = fromToMatch[1].trim();
    to = fromToMatch[2].trim();
  } else {
    // Pattern: "до Y"
    const toMatch = text.match(/(?:до|в|на)\s+(.+)/i);
    if (toMatch) {
      to = toMatch[1].trim();
    }
    // Pattern: "маршрут до Y"
    if (!to) {
      to = text.replace(/как проехать|как добраться|доехать|маршрут|путь/gi, "").trim();
    }
  }

  // Clean up instructions from strings
  const cleanStr = (s: string) => s.replace(/пешком|на машине|автобусом|на такси/gi, "").trim();
  
  const result: AICommandResult = {
    intent: "route",
    from: from ? normalizeLocation(cleanStr(from)) : undefined,
    to: to ? normalizeLocation(cleanStr(to)) : undefined,
    mode
  };

  console.log(`[ROUTE PARSER]`);
  console.log(`INPUT: ${message}`);
  console.log(`FROM: ${result.from || "USER_LOCATION"}`);
  console.log(`TO: ${result.to}`);
  console.log(`MODE: ${result.mode}`);

  return result;
}

/**
 * Main entry point for detecting navigation intents
 */
export function detectNavigationIntent(message: string): AICommandResult {
  const routeResult = parseRouteRequest(message);
  if (routeResult.intent === "route") return routeResult;

  // Simple search detection fallback
  const searchWords = ["найди", "где", "покажи", "адрес"];
  if (searchWords.some(word => message.toLowerCase().includes(word))) {
    const query = message.toLowerCase().replace(/найди|где находится|покажи на карте|адрес/gi, "").trim();
    return {
      intent: "search",
      to: query || message
    };
  }

  return { intent: "unknown" };
}