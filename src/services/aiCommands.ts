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
  // Russian
  ru: [
    /как (доехать|добраться|пройти|попасть) (до|в|на)\s+(.+)/i,
    /построй (маршрут|путь)(?: до)?\s+(.+)/i,
    /покажи (путь|маршрут|направление)(?: до)?\s+(.+)/i,
    /маршрут (до|в|на)\s+(.+)/i,
    /проложи маршрут/i,
  ],
  // Uzbek
  uz: [
    /qanday (borish|yetib borish|yo'l)\s+(.+)/i,
    /xarita (chiz|ko'rsat)/i,
    /yo'nalish/i,
  ],
  // English
  en: [
    /how (to get|to go|to reach)\s+(.+)/i,
    /show (me )?(the )?(way|route|direction)\s*(to)?\s+(.+)/i,
    /build (a )?route\s*(to)?\s+(.+)/i,
    /navigate (to)?\s+(.+)/i,
  ]
};

const TRANSPORT_KEYWORDS = {
  walking: ["пешком", "пешком", "walking", "on foot", "piyoda"],
  transit: ["автобус", "метро", "трамвай", "bus", "metro", "subway", "public transport", "avtobus"],
  car: ["машина", "авто", "такси", "car", "taxi", "driving", "avtomobil"]
};

const LOCATION_ALIASES: Record<string, string> = {
  "дом": "Дом",
  "работа": "Работа",
  "вокзал": "Железнодорожный вокзал",
  "аэропорт": "Аэропорт",
  "метро": "Станция метро",
  "больница": "Больница",
  "поликлиника": "Поликлиника",
  "мвд": "МВД",
  "домой": "Дом",
};

export function detectNavigationIntent(message: string): AICommandResult {
  const lowerMsg = message.toLowerCase();
  
  // Check if it's a route request
  const isRouteRequest = Object.values(ROUTE_PATTERNS).flat().some(pattern => 
    pattern.test(message)
  );

  if (!isRouteRequest) {
    return { intent: "unknown" };
  }

  // Determine transport mode
  let mode: TravelMode = "car";
  if (TRANSPORT_KEYWORDS.walking.some(k => lowerMsg.includes(k))) {
    mode = "walking";
  } else if (TRANSPORT_KEYWORDS.transit.some(k => lowerMsg.includes(k))) {
    mode = "transit";
  }

  // Extract locations
  let from: string | undefined;
  let to: string | undefined;

  // Try to match "from X to Y" pattern
  const fromToMatch = message.match(/(?:от|с|из|from)\s+(.+?)\s+(?:до|в|на|to)\s+(.+)/i);
  if (fromToMatch) {
    from = normalizeLocation(fromToMatch[1].trim());
    to = normalizeLocation(fromToMatch[2].trim());
  } else {
    // Try to extract destination only
    const destMatch = message.match(/(?:до|в|на|to)\s+(.+)/i);
    if (destMatch) {
      to = normalizeLocation(destMatch[1].trim());
    }
  }

  // If still no destination, try to extract from end of message
  if (!to) {
    const words = message.split(/\s+/);
    const lastFewWords = words.slice(-3).join(" ");
    to = normalizeLocation(lastFewWords);
  }

  return {
    intent: "route",
    from,
    to,
    mode
  };
}

function normalizeLocation(loc: string): string {
  const lowerLoc = loc.toLowerCase().trim();
  
  // Check aliases
  for (const [alias, normalized] of Object.entries(LOCATION_ALIASES)) {
    if (lowerLoc === alias || lowerLoc.includes(alias)) {
      return normalized;
    }
  }
  
  // Capitalize first letter
  return loc.charAt(0).toUpperCase() + loc.slice(1);
}

export function parseRouteRequest(message: string): AICommandResult {
  return detectNavigationIntent(message);
}