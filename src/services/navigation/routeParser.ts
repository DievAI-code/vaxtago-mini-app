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
  "челябинск", "краснодар", "сочи", "ростов", "питер",
  "великий новгород", "нижний новгород", "набережные челны",
  "пенза", "липецк", "тула", "киров", "чебоксары", "калининград",
  "брянск", "курск", "иваново", "магнитогорск", "тверь", "ставрополь",
  "нижний тагил", "белгород", "архангельск", "владимир",
  "курган", "смоленск", "калуга", "чита", "орёл", "орел", "вологда",
  "тамбов", "стерлитамак", "грозный", "якутск", "кострома",
  "комсомольск-на-амуре", "петрозаводск", "таганрог", "нальчик",
  "сыктывкар", "мурманск", "шахты", "братск",
  "орск", "ангарск", "кисловодск", "прокопьевск", "салават",
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * КРИТИЧНО: \b в JavaScript НЕ работает с кириллицей (это ASCII-only граница слова).
 * Поэтому границы слов строим через пробелы / начало / конец строки.
 */
const CITY_PATTERN = CITIES.slice()
  .sort((a, b) => b.length - a.length)
  .map(escapeRegex)
  .join("|");
const CITY_REGEX = new RegExp(`(^|\\s)(${CITY_PATTERN})(?=\\s|$|[.,!?])`, "iu");

const ROUTE_KEYWORDS = [
  "как доехать", "как добраться", "как проехать", "как пройти",
  "как попасть", "покажи маршрут", "проложи путь", "проложи маршрут",
  "построй маршрут", "маршрут от", "маршрут из", "дорога до", "сколько ехать",
  "покажи дорогу", "мне нужно попасть", "покажи как ехать",
  "как проехать до", "как доехать до", "как добраться до",
  "how to get", "directions to", "route to", "navigate to",
  "qanday borish", "qanday yetib borish", "marshrut",
];

/**
 * POI-словарь склонений (токен-уровень).
 * "вокзал*", "цирк*", "жд" НЕ включены сюда намеренно —
 * они обрабатываются фразовыми правилами PHRASE_RULES,
 * чтобы не было двойной нормализации.
 */
const DECLENSION_MAP: Record<string, string> = {
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
  "офиса": "офис", "офисе": "офис",
  "склада": "склад", "складе": "склад",
  "стройки": "стройка", "стройке": "стройка",
};

/**
 * Фразовые POI-правила (Cyrillic-safe, через пробельные границы).
 * Обязательный словарь из ТЗ:
 *   "жд"     → "железнодорожный"
 *   "вокзал" → "железнодорожный вокзал"
 *   "цирка"  → "цирк"
 *   "цирку"  → "цирк"
 */
const PHRASE_RULES: Array<[RegExp, string]> = [
  // "жд вокзал(а/у/е)" / "ж/д вокзала" / "ж.д. вокзал" → полное название
  [/\s(жд|ж\/д|ж\.д\.?)\s+вокзал[\p{L}]*/giu, " железнодорожный вокзал "],
  // одиночное "жд" → "железнодорожный"
  [/\s(жд|ж\/д|ж\.д\.?)\s/giu, " железнодорожный "],
  // одиночный "вокзал" (любое склонение) → "железнодорожный вокзал"
  [/\sвокзал[\p{L}]*/giu, " железнодорожный вокзал "],
  // "цирка/цирку/цирке/цирком" → "цирк"
  [/\sцирк[\p{L}]*/giu, " цирк "],
  // "торгового центра" → "торговый центр"
  [/\sторгов[\p{L}]+\s+центр[\p{L}]*/giu, " торговый центр "],
];

const POI_KEYWORDS = [
  "цирк", "вокзал", "жд", "аэропорт", "метро", "торговый центр", "больница",
  "магазин", "аптека", "банк", "кафе", "ресторан", "отель", "школа",
  "университет", "завод", "работа", "офис", "склад", "стройка",
  "железнодорожный вокзал",
];

export function normalizeLocation(loc: string): string {
  let result = " " + loc.toLowerCase().trim() + " ";

  for (const [re, rep] of PHRASE_RULES) {
    result = result.replace(re, rep);
  }

  const tokens = result
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => DECLENSION_MAP[w] || w);

  result = tokens.join(" ");
  result = result
    .replace(/\s(?:города|г)\s/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Удалить город в конце (страховка, если stripCity пропустил)
  result = result.replace(CITY_REGEX, " ").replace(/\s+/g, " ").trim();

  return result;
}

export function stripCity(text: string): { text: string; city?: string } {
  const m = text.match(CITY_REGEX);
  if (m && m[2]) {
    const city = m[2];
    const textWithoutCity = text.replace(CITY_REGEX, " ").replace(/\s+/g, " ").trim();
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
  return ROUTE_KEYWORDS.some((kw) => lower.includes(kw));
}

export function parseRoute(text: string): RouteParseResult {
  const lower = text.toLowerCase().trim();
  const isRoute = hasRouteKeyword(lower);

  let city: string | undefined;

  for (const pattern of FROM_TO_PATTERNS) {
    const match = lower.match(pattern);
    if (match && match.length >= 3) {
      const fromResult = stripCity(match[1].trim());
      const toResult = stripCity(match[2].trim());
      city = fromResult.city || toResult.city || stripCity(lower).city;

      const from = normalizeLocation(fromResult.text);
      const to = normalizeLocation(toResult.text);

      if (from && to) {
        console.log("[NAVIGATION DEBUG] Route parsed:", { from, to, city });
        return { intent: "route", from, to, city, mode: "car" };
      }
    }
  }

  if (isRoute) {
    for (const pattern of TO_ONLY_PATTERNS) {
      const match = lower.match(pattern);
      if (match && match.length >= 2) {
        const toResult = stripCity(match[1].trim());
        city = toResult.city || stripCity(lower).city;
        const to = normalizeLocation(toResult.text);

        if (to) {
          console.log("[NAVIGATION DEBUG] Route (to-only) parsed:", { to, city });
          return { intent: "route", from: undefined, to, city, mode: "car" };
        }
      }
    }

    for (const poi of POI_KEYWORDS) {
      if (lower.includes(poi)) {
        const toResult = stripCity(poi);
        city = toResult.city || stripCity(lower).city;
        const to = normalizeLocation(toResult.text);
        console.log("[NAVIGATION DEBUG] Route (POI) parsed:", { to, city });
        return { intent: "route", from: undefined, to, city, mode: "car" };
      }
    }
  }

  return { intent: "unknown" };
}