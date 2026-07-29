"use client";

import { parseRoute } from "./routeParser";

export type NavigationIntentType = "route" | "place_search" | "nearby_search" | "navigation_open" | "unknown";

export interface NavigationIntent {
  type: NavigationIntentType;
  from?: string;
  to?: string;
  city?: string;
  query?: string;
  mode?: "car" | "walking" | "transit";
}

const NEARBY_PATTERNS = [
  /ближайший|ближайшая|рядом|поблизости|что рядом|nearby|near me|closest/i,
];

const PLACE_SEARCH_PATTERNS = [
  /найди|где находится|покажи|поиск|адрес|find|where is|search|locate/i,
];

const NAV_OPEN_PATTERNS = [
  /открой карту|запусти навигатор|открой навигатор|open map|start navigation/i,
];

// \b не работает с кириллицей — используем пробельные границы
const CITY_LIST =
  "тюмень|москва|санкт-петербург|спб|казань|екатеринбург|новосибирск|ташкент|самарканд|сургут|нижневартовск|тобольск|ишим|алматы|астана";
const CITY_REGEX = new RegExp(`(^|\\s)(${CITY_LIST})(?=\\s|$|[.,!?])`, "iu");

function extractCity(text: string): string | undefined {
  const m = text.match(CITY_REGEX);
  if (m && m[2]) {
    return m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
  }
  return undefined;
}

function extractQuery(text: string): string | undefined {
  let result = text;
  const phrases = [
    "как доехать", "как добраться", "как проехать", "покажи маршрут", "проложи путь", "маршрут", "дорога до", "сколько ехать", "покажи дорогу",
    "найди", "где находится", "покажи", "поиск", "адрес", "ближайший", "ближайшая", "рядом", "поблизости",
    "открой карту", "запусти навигатор", "от", "до", "в", "на", "к", "города",
  ];

  for (const p of phrases) {
    result = result.replace(new RegExp(p, "gi"), "");
  }

  result = result.replace(CITY_REGEX, "");
  result = result.replace(/[?.,!]/g, "").replace(/\s+/g, " ").trim();
  return result.length > 1 ? result : undefined;
}

export function parseNavigationIntent(text: string): NavigationIntent {
  const lower = text.toLowerCase().trim();

  if (NAV_OPEN_PATTERNS.some((p) => p.test(lower))) {
    return { type: "navigation_open", query: extractQuery(lower) };
  }

  // Route Parser запускается обязательно ПЕРЕД поиском
  const routeResult = parseRoute(text);
  if (routeResult.intent === "route") {
    return {
      type: "route",
      from: routeResult.from,
      to: routeResult.to,
      city: routeResult.city,
      mode: routeResult.mode || "car",
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