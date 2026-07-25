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

const CITY_REGEX = /(тюмень|москва|санкт-петербург|спб|казань|екатеринбург|новосибирск|ташкент|самарканд|сургут|нижневартовск|тобольск|ишим|алматы|астана)/i;

function extractCity(text: string): string | undefined {
  const m = text.match(CITY_REGEX);
  if (m) {
    return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
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

  const cityMatch = result.match(CITY_REGEX);
  if (cityMatch) {
    result = result.replace(cityMatch[0], "");
  }

  result = result.replace(/[?.,!]/g, "").replace(/\s+/g, " ").trim();
  return result.length > 1 ? result : undefined;
}

export function parseNavigationIntent(text: string): NavigationIntent {
  const lower = text.toLowerCase().trim();

  // 1. Check navigation open
  if (NAV_OPEN_PATTERNS.some((p) => p.test(lower))) {
    return { type: "navigation_open", query: extractQuery(lower) };
  }

  // 2. Use the new route parser for route detection
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

  // 3. Check nearby search
  if (NEARBY_PATTERNS.some((p) => p.test(lower))) {
    return {
      type: "nearby_search",
      query: extractQuery(lower) || undefined,
      city: extractCity(lower),
    };
  }

  // 4. Check place search
  if (PLACE_SEARCH_PATTERNS.some((p) => p.test(lower))) {
    return {
      type: "place_search",
      query: extractQuery(lower) || undefined,
      city: extractCity(lower),
    };
  }

  return { type: "unknown", query: extractQuery(lower) || text };
}