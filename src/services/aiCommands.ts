"use client";

export type TravelIntent = "route" | "search" | "unknown";
export type TravelMode = "car" | "walking" | "transit";

export interface AICommandResult {
  intent: TravelIntent;
  from?: string;
  to?: string;
  mode?: TravelMode;
}

const ROUTE_PATTERNS = {
  ru: [
    /как (доехать|добраться|пройти|попасть) (до|в|на)\s+(.+)/i,
    /построй (маршрут|путь)(?: до)?\s+(.+)/i,
    /покажи (путь|маршрут|направление)(?: до)?\s+(.+)/i,
    /маршрут (до|в|на)\s+(.+)/i,
    /проложи маршрут/i,
    /построить маршрут/i,
    /как проехать до\s+(.+)/i,
  ],
  uz: [
    /qanday (borish|yetib borish|yo'l)\s+(.+)/i,
    /xarita (chiz|ko'rsat)/i,
    /yo'nalish/i,
    /qanday borish mumkin/i,
  ],
  en: [
    /how (to get|to go|to reach)\s+(.+)/i,
    /show (me )?(the )?(way|route|direction)\s*(to)?\s+(.+)/i,
    /build (a )?route\s*(to)?\s+(.+)/i,
    /navigate (to)?\s+(.+)/i,
    /directions to\s+(.+)/i,
  ],
};

const TRANSPORT_KEYWORDS = {
  walking: ["пешком", "walking", "on foot", "piyoda", "oyakka", "oyakka borish"],
  transit: ["автобус", "метро", "трамвай", "bus", "metro", "subway", "public transport", "avtobus", "marshrut"],
  car: ["машина", "авто", "такси", "car", "taxi", "driving", "avtomobil", "mashinada"],
};

const LOCATION_ALIASES: Record<string, string> = {
  "дом": "Дом",
  "домой": "Дом",
  "работа": "Работа",
  "вокзал": "Железнодорожный вокзал",
  "ж/д вокзал": "Железнодорожный вокзал",
  "жд вокзал": "Железнодорожный вокзал",
  "ж/д": "Железнодорожный вокзал",
  "жд": "Железнодорожный вокзал",
  "аэропорт": "Аэропорт",
  "метро": "Станция метро",
  "больница": "Больница",
  "поликлиника": "Поликлиника",
  "мвд": "МВД",
  "мфц": "МФЦ",
  "полиция": "Полиция",
  "почта": "Почта",
  "банк": "Банк",
};

export function detectNavigationIntent(message: string): AICommandResult {
  const lowerMsg = message.toLowerCase();

  const isRouteRequest = Object.values(ROUTE_PATTERNS).flat().some((pattern) =>
    pattern.test(message)
  );

  if (!isRouteRequest) {
    return { intent: "unknown" };
  }

  let mode: TravelMode = "car";
  if (TRANSPORT_KEYWORDS.walking.some((k) => lowerMsg.includes(k))) {
    mode = "walking";
  } else if (TRANSPORT_KEYWORDS.transit.some((k) => lowerMsg.includes(k))) {
    mode = "transit";
  }

  let from: string | undefined;
  let to: string | undefined;

  const fromToMatch = message.match(
    /(?:от|с|из|from)\s+(.+?)\s+(?:до|в|на|to)\s+(.+)/i
  );
  if (fromToMatch) {
    from = normalizeLocation(fromToMatch[1].trim());
    to = normalizeLocation(fromToMatch[2].trim());
  } else {
    const destMatch = message.match(/(?:до|в|на|to)\s+(.+)/i);
    if (destMatch) {
      to = normalizeLocation(destMatch[1].trim());
    }
  }

  if (!to) {
    const words = message.split(/\s+/);
    const lastFewWords = words.slice(-3).join(" ");
    to = normalizeLocation(lastFewWords);
  }

  return {
    intent: "route",
    from,
    to,
    mode,
  };
}

function normalizeLocation(loc: string): string {
  const lowerLoc = loc.toLowerCase().trim();

  for (const [alias, normalized] of Object.entries(LOCATION_ALIASES)) {
    if (lowerLoc === alias || lowerLoc.includes(alias)) {
      return normalized;
    }
  }

  return loc.charAt(0).toUpperCase() + loc.slice(1);
}

export function parseRouteRequest(message: string): AICommandResult {
  return detectNavigationIntent(message);
}