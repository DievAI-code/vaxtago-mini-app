'железнодорожный').">
"use client";

import { TravelMode } from "./maps/routeService";

export interface NavIntent {
  intent: "route" | "search" | "unknown";
  from?: { query: string };
  to?: { query: string };
  mode: TravelMode;
  category?: string;
}

const VOCABULARY: Record<string, string> = {
  "вокзал": "железнодорожный вокзал",
  "жд": "железнодорожный",
  "офис": "организация",
  "работа": "вакансия",
  "доехать": "route",
  "добраться": "route",
  "путь": "route",
  "маршрут": "route",
};

/**
 * Detects navigation intent from natural language
 */
export function detectNavigationIntent(message: string): NavIntent {
  const low = message.toLowerCase().trim();
  
  // 1. Detect Mode
  let mode: TravelMode = "car"; // default
  if (/пешком|ногами|пройти/i.test(low)) mode = "walking";
  else if (/автобус|маршрутка|метро|транспорт|едет/i.test(low)) mode = "transit";

  // 2. Identify Action
  const isRoute = /маршрут|как доехать|как добраться|путь|от .* до/i.test(low);
  
  if (isRoute) {
    // Advanced parsing for "from X to Y"
    const fromToRegex = /(?:от|с|из)\s+(.+?)\s+(?:до|в|на)\s+(.+)/i;
    const match = low.match(fromToRegex);
    
    if (match) {
      return {
        intent: "route",
        from: { query: normalizeQuery(match[1]) },
        to: { query: normalizeQuery(match[2]) },
        mode
      };
    }

    // Fallback: assume destination only
    const destination = low.replace(/построй маршрут до|маршрут до|как доехать до|как добраться до/gi, "").trim();
    return {
      intent: "route",
      to: { query: normalizeQuery(destination) },
      mode
    };
  }

  return { intent: "unknown", mode: "car" };
}

function normalizeQuery(text: string): string {
  let result = text;
  for (const [key, val] of Object.entries(VOCABULARY)) {
    if (result.includes(key)) result = result.replace(key, val);
  }
  return result;
}