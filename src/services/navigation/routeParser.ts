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
  "челябинск", "краснодар", "сочи", "ростов", "питер", "самара",
  "великий новгород", "нижний новгород", "набережные челны",
  "пенза", "липецк", "тула", "киров", "чебоксары", "калининград",
  "брянск", "курск", "иваново", "магнитогорск", "тверь", "ставрополь",
  "нижний тагил", "белгород", "архангельск", "владимир", "сочи",
  "курган", "смоленск", "калуга", "чита", "орёл", "орел", "вологда",
  "тамбов", "стерлитамак", "грозный", "якутск", "кострома",
  "комсомольск-на-амуре", "петрозаводск", "таганрог", "нальчик",
  "сыктывкар", "мурманск", "великий новгород", "шахты", "братск",
  "орск", "ангарск", "кисловодск", "прокопьевск", "салават", "сургут",
  "нижневартовск", "тобольск", "ишим",
];

const CITY_REGEX = new RegExp(`\\b(${CITIES.join("|")})\\b`, "i");

const ROUTE_KEYWORDS = [
  "как доехать", "как добраться", "как проехать", "как пройти",
  "как попасть", "покажи маршрут", "проложи путь", "проложи маршрут",
  "построй маршрут", "маршрут от", "дорога до", "сколько ехать",
  "покажи дорогу", "мне нужно попасть", "покажи как ехать",
  "как проехать до", "как доехать до", "как добраться до",
  "how to get", "directions to", "route to", "navigate to",
  "qanday borish", "qanday yetib borish", "marshrut",
];

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
  
  result = result.replace(/\bжд\b/gi, "железнодорожный вокзал");
  result = result.replace(/\bж\/д\b/gi, "железнодорожный вокзал");
  result = result.replace(/железнодорожного вокзала/gi, "железнодорожный вокзал");
  result = result.replace(/железнодорожном вокзале/gi, "железнодорожный вокзал");
  
  result = result.replace(/торгового центра/gi, "торговый центр");
  result = result.replace(/торговом центре/gi, "торговый центр");
  result = result.replace(/торгового/gi, "торговый");
  
  for (const [key, value] of Object.entries(DECLENSION_MAP)) {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    result = result.replace(regex, value);
  }
  
  result = result
    .replace(/\s+(?:города|г)\s+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  
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
  "работа", "офис", "склад", "стройка", "железнодорожный вокзал",
];

export function parseRoute(text: string): RouteParseResult {
  const lower = text.toLowerCase().trim();
  const isRoute = hasRouteKeyword(lower);
  
  let city: string | undefined;
  
  for (const pattern of FROM_TO_PATTERNS) {
    const match = lower.match(pattern);
    if (match && match.length >= 3) {
      let rawFrom = match[1].trim();
      let rawTo = match[2].trim();
      
      const fromResult = stripCity(rawFrom);
      const toResult = stripCity(rawTo);
      
      city = fromResult.city || toResult.city || stripCity(lower).city;
      
      const from = normalizeLocation(fromResult.text);
      const to = normalizeLocation(toResult.text);
      
      if (from && to) {
        console.log(`[VAQTA ROUTE] Route parsed:`, { from, to, city });
        return { intent: "route", from, to, city, mode: "car" };
      }
    }
  }
  
  if (isRoute) {
    for (const pattern of TO_ONLY_PATTERNS) {
      const match = lower.match(pattern);
      if (match && match.length >= 2) {
        let rawTo = match[1].trim();
        const toResult = stripCity(rawTo);
        city = toResult.city || stripCity(lower).city;
        const to = normalizeLocation(toResult.text);
        
        if (to) {
          console.log(`[VAQTA ROUTE] Route (to-only) parsed:`, { to, city });
          return { intent: "route", from: undefined, to, city, mode: "car" };
        }
      }
    }
    
    for (const poi of POI_KEYWORDS) {
      if (lower.includes(poi)) {
        const toResult = stripCity(poi);
        city = toResult.city || stripCity(lower).city;
        console.log(`[VAQTA ROUTE] Route (POI) parsed:`, { to: poi, city });
        return { intent: "route", from: undefined, to: normalizeLocation(poi), city, mode: "car" };
      }
    }
  }
  
  console.log(`[VAQTA ROUTE] No route detected in: "${text}"`);
  return { intent: "unknown" };
}