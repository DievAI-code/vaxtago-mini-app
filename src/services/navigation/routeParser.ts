"use client";

export interface RouteParseResult {
  intent: "route" | "unknown";
  from?: string;
  to?: string;
  city?: string;
  mode?: "car" | "walking" | "transit";
}

const CITIES = [
  "тюмень", "москва", "санкт-петербург", "спб", "казань", "екатеринбург",
  "новосибирск", "ташкент", "самарканд", "сургут", "нижневартовск",
  "тобольск", "ишим", "алматы", "астана", "уфа", "самара", "омск",
  "челябинск", "краснодар", "сочи", "ростов", "питер"
];

const CITY_REGEX = new RegExp(`\\b(${CITIES.join("|")})\\b`, "i");

const ROUTE_KEYWORDS = [
  "как доехать", "как добраться", "как проехать", "как пройти",
  "покажи маршрут", "проложи путь", "проложи маршрут", "построй маршрут",
  "маршрут от", "дорога до", "сколько ехать", "покажи дорогу",
  "how to get", "directions to", "route to", "navigate to",
  "qanday borish", "qanday yetib borish", "marshrut"
];

// Normalization: declension → nominative
const DECLENSION_MAP: Record<string, string> = {
  "цирка": "цирк", "цирке": "цирк", "цирку": "цирк", "цирком": "цирк",
  "вокзала": "вокзал", "вокзале": "вокзал", "вокзалу": "вокзал", "вокзалом": "вокзал",
  "аэропорта": "аэропорт", "аэропорту": "аэропорт", "аэропорте": "аэропорт",
  "магазина": "магазин", "магазине": "магазин", "магазину": "магазин",
  "больницы": "больница", "больнице": "больница", "больницу": "больница",
  "аптеки": "аптека", "аптеке": "аптека", "аптеку": "аптека",
  "банка": "банк", "банке": "банк", "банку": "банк",
  "отеля": "отель", "отеле": "отель", "отелю": "отель",
  "гостиницы": "гостиница", "гостинице": "гостиница", "гостиницу": "гостиница",
  "школы": "школа", "школе": "школа", "школу": "школа",
  "университета": "университет", "университете": "университет",
  "завода": "завод", "заводе": "завод", "заводу": "завод",
  "работы": "работа", "работе": "работа", "работу": "работа",
  "дома": "дом", "дому": "дом", "доме": "дом",
  "метро": "метро",
  "кафе": "кафе",
  "офиса": "офис", "офисе": "офис",
  "склада": "склад", "складе": "склад",
  "стройки": "стройка", "стройке": "стройка",
};

function normalizeLocation(loc: string): string {
  let result = loc.toLowerCase().trim();
  
  // Replace "жд" with "железнодорожный"
  result = result.replace(/\bжд\b/gi, "железнодорожный");
  
  // "торгового центра" → "торговый центр"
  result = result.replace(/торгового центра/gi, "торговый центр");
  result = result.replace(/торговом центре/gi, "торговый центр");
  result = result.replace(/торгового/gi, "торговый");
  
  // Apply declension normalization
  for (const [key, value] of Object.entries(DECLENSION_MAP)) {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    result = result.replace(regex, value);
  }
  
  // Clean up extra spaces and trim trailing prepositions
  result = result
    .replace(/\s+(?:города|г)\s+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  // Remove trailing "тюмень" or other city names if they slipped through
  for (const city of CITIES) {
    result = result.replace(new RegExp(`\\s${city}$`, "i"), "");
  }
  
  return result.trim();
}

function stripCity(text: string): { text: string; city?: string } {
  const m = text.match(CITY_REGEX);
  if (m) {
    const city = m[1];
    const textWithoutCity = text.replace(CITY_REGEX, "").replace(/\s+/g, " ").trim();
    const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    return { text: textWithoutCity, city: capitalizedCity };
  }
  return { text };
}

// Route extraction patterns
const FROM_TO_PATTERNS = [
  /(?:от|с|из)\s+(.+?)\s+(?:до|в|на|к)\s+(.+)/i,
];

const TO_ONLY_PATTERNS = [
  /(?:до|в|на|к)\s+(.+)/i,
];

function hasRouteKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return ROUTE_KEYWORDS.some(kw => lower.includes(kw));
}

const POI_KEYWORDS = [
  "цирк", "вокзал", "аэропорт", "метро", "торговый центр", "больница", "магазин",
  "аптека", "банк", "кафе", "ресторан", "отель", "школа", "университет", "завод",
  "работа", "офис", "склад", "стройка", "железнодорожный вокзал"
];

export function parseRoute(text: string): RouteParseResult {
  const lower = text.toLowerCase().trim();
  const isRoute = hasRouteKeyword(lower);
  
  let city: string | undefined;
  
  // Try from-to patterns first
  for (const pattern of FROM_TO_PATTERNS) {
    const match = lower.match(pattern);
    if (match && match.length >= 3) {
      let rawFrom = match[1].trim();
      let rawTo = match[2].trim();
      
      // Strip city from both
      const fromResult = stripCity(rawFrom);
      const toResult = stripCity(rawTo);
      
      // City priority: from > to > full text
      city = fromResult.city || toResult.city || stripCity(lower).city;
      
      const from = normalizeLocation(fromResult.text);
      const to = normalizeLocation(toResult.text);
      
      if (from && to) {
        return { intent: "route", from, to, city, mode: "car" };
      }
    }
  }
  
  // Try to-only patterns (route keyword present but no from)
  if (isRoute) {
    for (const pattern of TO_ONLY_PATTERNS) {
      const match = lower.match(pattern);
      if (match && match.length >= 2) {
        let rawTo = match[1].trim();
        const toResult = stripCity(rawTo);
        city = toResult.city || stripCity(lower).city;
        const to = normalizeLocation(toResult.text);
        
        if (to) {
          return { intent: "route", from: undefined, to, city, mode: "car" };
        }
      }
    }
    
    // Route keyword but no destination pattern - check for POI keywords
    for (const poi of POI_KEYWORDS) {
      if (lower.includes(poi)) {
        const toResult = stripCity(poi);
        city = toResult.city || stripCity(lower).city;
        return { intent: "route", from: undefined, to: normalizeLocation(poi), city, mode: "car" };
      }
    }
  }
  
  return { intent: "unknown" };
}