"use client";

export type TravelIntent = "route" | "search" | "unknown";
export type TravelMode = "car" | "walking" | "transit";

export interface AICommandResult {
  intent: TravelIntent;
  from?: string;
  to?: string;
  mode?: TravelMode;
  city?: string;
}

const ROUTE_KEYWORDS = [
  "как доехать", "как добраться", "как пройти", "как проехать",
  "построй маршрут", "проложи путь", "проложи маршрут",
  "маршрут", "дорога до", "сколько ехать",
  "qanday borish", "qanday yetib borish", "marshrut",
  "how to get", "directions to", "route to", "navigate to"
];

const SEARCH_KEYWORDS = [
  "найди", "где", "покажи", "поиск", "адрес",
  "ближайший", "рядом", "недалеко",
  "topib ber", "qayerda", "yaqin",
  "find", "where is", "show me", "search"
];

const POI_KEYWORDS = [
  "цирк", "вокзал", "аэропорт", "метро", "торговый центр", "больница", "магазин",
  "аптека", "банк", "кафе", "ресторан", "отель", "школа", "университет",
  "цирк", "vokzal", "aeroport", "metro", "savdo markazi", "kasalxona", "magazin",
  "circus", "station", "airport", "subway", "mall", "hospital", "shop", "store"
];

export function detectNavigationIntent(message: string): AICommandResult {
  const lowerMsg = message.toLowerCase().trim();

  const fromToMatch = lowerMsg.match(/(?:от|с|из|from)\s+(.+?)\s+(?:до|в|на|to)\s+(.+)/i);
  
  const isRouteRequest = ROUTE_KEYWORDS.some(kw => lowerMsg.includes(kw));

  if (isRouteRequest || (fromToMatch && !SEARCH_KEYWORDS.some(kw => lowerMsg.includes(kw)))) {
    let from: string | undefined;
    let to: string | undefined;
    let city: string | undefined;

    // Extract city
    const cityMatch = lowerMsg.match(/(тюмень|москва|санкт-петербург|спб|казань|екатеринбург|новосибирск|ташкент|самарканд|сургут|нижневартовск|тобольск|ишим)/i);
    if (cityMatch) city = cityMatch[1];

    if (fromToMatch) {
      from = fromToMatch[1].trim();
      to = fromToMatch[2].trim();
    } else {
      const destMatch = lowerMsg.match(/(?:до|в|на|to)\s+(.+)/i);
      if (destMatch) {
        to = destMatch[1].trim();
      }
    }

    // Fallback if to is still empty but it's a route request
    if (!to && isRouteRequest) {
      const poiMatch = lowerMsg.match(/(цирк|вокзал|аэропорт|метро|торговый центр|больница|магазин|аптека|банк|кафе|ресторан|отель|школа|университет)/i);
      if (poiMatch) to = poiMatch[0];
    }

    return {
      intent: "route",
      from: from || undefined,
      to: to || undefined,
      mode: "car",
      city: city || undefined
    };
  }

  return { intent: "unknown" };
}