"use client";

export type TravelIntent = "route" | "search" | "unknown";
export type TravelMode = "car" | "walking" | "transport";

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
  "метро": "Метро",
  "дом": "Дом",
  "работа": "Работа",
  "больница": "Больница",
  "поликлиника": "Поликлиника",
  "мвд": "МВД",
  "миграционный центр": "Миграционный центр",
};

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

export function parseRouteRequest(message: string): AICommandResult {
  const text = message.toLowerCase().trim();
  
  let mode: TravelMode = "car";
  if (/пешком|ногами|пройти|прогулка/i.test(text)) mode = "walking";
  else if (/автобус|маршрутка|метро|транспорт|общественный/i.test(text)) mode = "transport";

  const routeKeywords = ["как проехать", "как добраться", "доехать", "маршрут", "путь", "от ", " с ", " из ", "построй маршрут", "проложи", "навигация", "доехать до", "добраться до"];
  const isRoute = routeKeywords.some(kw => text.includes(kw));

  if (!isRoute) {
    return { intent: "unknown" };
  }

  let from: string | undefined;
  let to: string | undefined;

  const fromToMatch = text.match(/(?:от|с|из)\s+(.+?)\s+(?:до|в|на)\s+(.+)/i);
  if (fromToMatch) {
    from = fromToMatch[1].trim();
    to = fromToMatch[2].trim();
  } else {
    const toMatch = text.match(/(?:до|в|на)\s+(.+)/i);
    if (toMatch) {
      to = toMatch[1].trim();
    }
    if (!to) {
      to = text.replace(/как проехать|как добраться|доехать|маршрут|путь|построй|проложи|навигация/gi, "").trim();
    }
  }

  const cleanStr = (s: string) => s.replace(/пешком|на машине|автобусом|на такси|маршрутка|метро/gi, "").trim();
  
  return {
    intent: "route",
    from: from ? normalizeLocation(cleanStr(from)) : undefined,
    to: to ? normalizeLocation(cleanStr(to)) : undefined,
    mode
  };
}

export function detectNavigationIntent(message: string): AICommandResult {
  const routeResult = parseRouteRequest(message);
  if (routeResult.intent === "route") return routeResult;

  const searchWords = ["найди", "где", "покажи", "адрес", "место", "локация"];
  if (searchWords.some(word => message.toLowerCase().includes(word))) {
    const query = message.toLowerCase().replace(/найди|где находится|покажи на карте|адрес/gi, "").trim();
    return {
      intent: "search",
      to: query || message
    };
  }

  return { intent: "unknown" };
}