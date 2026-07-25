"use client";

export type NavigationIntentType = "route" | "place_search" | "nearby_search" | "navigation_open" | "unknown";

export interface NavigationIntent {
  type: NavigationIntentType;
  from?: string;
  to?: string;
  city?: string;
  query?: string;
  mode?: "car" | "walking" | "transit";
}

const ROUTE_PATTERNS = [
  /как доехать|как добраться|покажи маршрут|проложи путь|маршрут от|дорога до|сколько ехать|how to get|directions to|navigate to/i,
  /(?:от|с|из)\s+(.+?)\s+(?:до|в|на)\s+/i,
];

const NEARBY_PATTERNS = [
  /ближайший|ближайшая|рядом|поблизости|что рядом|nearby|near me|closest/i,
];

const PLACE_SEARCH_PATTERNS = [
  /найди|где находится|покажи|поиск|адрес|find|where is|search|locate/i,
];

const NAV_OPEN_PATTERNS = [
  /открой карту|запусти навигатор|открой навигатор|open map|start navigation/i,
];

const CITY_REGEX = /(тюмень|москва|санкт-петербург|спб|казань|екатеринбург|новосибирск|ташкент|самарканд|сургут|нижневартовск|тобольск|ишим|алматы|астана)/i;

const POI_KEYWORDS = [
  "цирк", "вокзал", "аэропорт", "метро", "торговый центр", "больница", "магазин",
  "аптека", "банк", "кафе", "ресторан", "отель", "школа", "университет", "завод",
  "работа", "работодатель", "офис", "склад", "стройка",
];

function extractFromTo(text: string): { from?: string; to?: string } {
  const m = text.match(/(?:от|с|из)\s+(.+?)\s+(?:до|в|на|к)\s+(.+)/i);
  if (m) {
    return { from: m[1].trim(), to: m[2].trim() };
  }

  const destMatch = text.match(/(?:до|в|на|к)\s+(.+)/i);
  if (destMatch) {
    return { to: destMatch[1].trim() };
  }

  return {};
}

function extractCity(text: string): string | undefined {
  const m = text.match(CITY_REGEX);
  return m ? m[1] : undefined;
}

function extractQuery(text: string): string | undefined {
  let result = text;
  const phrases = [
    "как доехать", "как добраться", "покажи маршрут", "проложи путь", "маршрут", "дорога до", "сколько ехать",
    "найди", "где находится", "покажи", "поиск", "адрес", "ближайший", "ближайшая", "рядом", "поблизости",
    "открой карту", "запусти навигатор", "от", "до", "в", "на", "к", "города",
  ];

  for (const p of phrases) {
    result = result.replace(new RegExp(p, "gi"), "");
  }

  const cityMatch = result.match(CITY_REGEX);
  if (cityMatch) {
    result = result.replace(cityMatch[0], "");
  }

  result = result.replace(/[?.,!]/g, "").replace(/\s+/g, " ").trim();
  return result.length > 1 ? result : undefined;
}

export function parseNavigationIntent(text: string): NavigationIntent {
  const lower = text.toLowerCase().trim();

  if (NAV_OPEN_PATTERNS.some((p) => p.test(lower))) {
    return { type: "navigation_open", query: extractQuery(lower) };
  }

  if (ROUTE_PATTERNS.some((p) => p.test(lower))) {
    const { from, to } = extractFromTo(lower);
    const city = extractCity(lower);

    let finalTo = to;
    if (!finalTo) {
      for (const poi of POI_KEYWORDS) {
        if (lower.includes(poi)) {
          finalTo = poi;
          break;
        }
      }
    }

    return {
      type: "route",
      from: from,
      to: finalTo,
      city,
      mode: "car",
    };
  }

  if (NEARBY_PATTERNS.some((p) => p.test(lower))) {
    return {
      type: "nearby_search",
      query: extractQuery(lower) || undefined,
      city: extractCity(lower),
    };
  }

  if (PLACE_SEARCH_PATTERNS.some((p) => p.test(lower))) {
    return {
      type: "place_search",
      query: extractQuery(lower) || undefined,
      city: extractCity(lower),
    };
  }

  return { type: "unknown", query: extractQuery(lower) || text };
}