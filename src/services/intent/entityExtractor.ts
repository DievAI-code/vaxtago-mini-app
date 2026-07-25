/**
 * Извлечение сущностей (entities) из нормализованного текста.
 *
 * Возможности:
 *  - city: город (Россия, Узбекистан, Казахстан, Кыргызстан, Таджикистан)
 *  - profession: профессия (300+ вариантов на RU/UZ/EN)
 *  - place: POI-категория (аптека, больница, мечеть и т.д.)
 *  - org: организация (Сбер, ВТБ, Ozon, Wildberries и т.д.)
 *  - routeFromTo: { from, to } из фразы «от A до B»
 *  - textObject: что искать в карте/AI (название улицы, места, описание)
 *  - documentType: тип документа (патент, паспорт, миграционная карта)
 *
 * Все словари — отдельные модули (cities, professions, places, synonyms).
 */

import { SYNONYMS } from "./synonyms";
import { getCityEntry, getAllCities, CITIES_BY_COUNTRY, type CityEntry, type Country } from "./cities";
import { getProfessionEntry, getAllProfessions, getAllProfessionVariants, type ProfessionEntry } from "./professions";
import { findPlaceInText, findOrgInText, type PlaceCategory } from "./places";

export interface ExtractedEntities {
  city?: string;
  cityCountry?: Country;
  profession?: string;
  professionDisplay?: { ru: string; uz: string; en: string };
  placeCategory?: PlaceCategory;
  placeDisplay?: { ru: string; uz: string; en: string };
  orgName?: string;
  routeFromTo?: { from?: string; to?: string };
  textObject?: string;
  documentType?: "passport" | "patent" | "migration_card" | "registration" | "contract" | "general";
}

const REGEX_CACHE = new Map<string, RegExp>();
function rx(pattern: string, flags = "gi"): RegExp {
  const key = `${flags}::${pattern}`;
  let re = REGEX_CACHE.get(key);
  if (!re) {
    re = new RegExp(pattern, flags);
    REGEX_CACHE.set(key, re);
  }
  return re;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Нормализация: схлопывает пробелы, убирает кавычки, приводит к нижнему регистру,
 * заменяет STT-варианты на каноны (karta, vakansiya, tarjima и т.д.).
 */
export function normalizeInput(text: string): string {
  let result = text.toLowerCase();
  // Убираем ʼ/' вариации апострофов
  result = result.replace(/['ʼ`´]/g, "'");
  // Схлопываем пробелы
  result = result.replace(/\s+/g, " ").trim();
  // Применяем словарь синонимов (длинные ключи первыми)
  const keys = Object.keys(SYNONYMS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const re = rx(`\\b${escapeRegex(key)}\\b`, "g");
    result = result.replace(re, SYNONYMS[key]);
  }
  return result;
}

/** Определяет язык нормализованного текста. */
export function detectLanguage(normalized: string, original: string): "ru" | "uz" | "en" {
  // Узбекская кириллица
  if (/[ўғқҳ]/i.test(original)) return "uz";
  // Узбекская латиница — типичные слова
  const uzbekLatinTriggers = [
    "ish", "ishla", "ishchi", "vakansiya", "qil", "qilish", "karta", "xarita",
    "manzil", "tarjima", "skanerla", "qayerda", "qayerdaligini", "qanday", "kerak",
    "haydovchi", "quruvchi", "chilangar", "elektrik", "santexnik", "payvandchi",
    "oshpaz", "menga", "bilan", "uchun", "misol", "eng yaqin", "topib",
  ];
  for (const trig of uzbekLatinTriggers) {
    if (rx(`\\b${trig}\\b`, "i").test(normalized)) return "uz";
  }
  // Чистая кириллица
  if (/[а-яё]/i.test(original) && !/[a-z]/i.test(original)) return "ru";
  // Чистая латиница
  if (/[a-z]/i.test(original) && !/[а-яё]/i.test(original)) return "en";
  return "ru";
}

/** Извлекает город из текста. Приоритет — более длинные варианты. */
export function extractCity(text: string, normalized: string): { city: string; country: Country; entry: CityEntry } | null {
  // Универсальный поиск по всем городам
  const allVariants = getAllCities().flatMap((c) => c.variants);
  // Сортируем по длине варианта (длинные первыми)
  const sorted = allVariants.slice().sort((a, b) => b.length - a.length);
  for (const variant of sorted) {
    const re = rx(`\\b${escapeRegex(variant)}\\b`, "i");
    if (re.test(normalized)) {
      const entry = getCityEntry(variant);
      if (entry) return { city: entry.canonical, country: entry.country, entry };
    }
  }
  return null;
}

/** Извлекает профессию из текста. Специализированные > разговорные. */
export function extractProfession(text: string, normalized: string): { profession: string; entry: ProfessionEntry } | null {
  // Сортируем по длине варианта (длинные/специфичные первыми)
  const sorted = getAllProfessionVariants().slice().sort((a, b) => b.length - a.length);
  for (const variant of sorted) {
    const re = rx(`\\b${escapeRegex(variant)}\\b`, "i");
    if (re.test(normalized)) {
      const entry = getProfessionEntry(variant);
      if (entry) {
        return { profession: variant, entry };
      }
    }
  }
  return null;
}

/** Извлекает POI-категорию (аптека, больница, мечеть, банк, ...) */
export function extractPlace(text: string, normalized: string): { category: PlaceCategory; display: { ru: string; uz: string; en: string } } | null {
  const place = findPlaceInText(normalized);
  if (!place) return null;
  return { category: place.category, display: place.display };
}

/** Извлекает организацию (Сбер, ВТБ, Ozon, ...) */
export function extractOrg(text: string, normalized: string): { name: string } | null {
  const org = findOrgInText(normalized);
  if (!org) return null;
  return { name: org.name };
}

/**
 * Извлекает «откуда → куда» из фразы.
 * Примеры:
 *   "от A до B" → { from: "A", to: "B" }
 *   "из A в B" → { from: "A", to: "B" }
 *   "A dan B ga" → { from: "A", to: "B" }
 *   "from A to B" → { from: "A", to: "B" }
 */
export function extractRouteFromTo(text: string, normalized: string): { from?: string; to?: string } {
  // RU: от/из/с ... до/в/на
  let m = text.match(/\b(от|из|с)\s+([а-яa-z0-9\s\-]{2,30}?)\s+(до|в|на)\s+([а-яa-z0-9\s\-]{2,30})/i);
  if (m) return { from: m[2].trim(), to: m[4].trim() };
  // UZ: ... dan ... ga
  m = text.match(/([a-z0-9\s\-]{2,30}?)\s+dan\s+([a-z0-9\s\-]{2,30}?)\s+ga/i);
  if (m) return { from: m[1].trim(), to: m[2].trim() };
  // EN: from ... to
  m = text.match(/\bfrom\s+([a-z0-9\s\-]{2,30}?)\s+to\s+([a-z0-9\s\-]{2,30})/i);
  if (m) return { from: m[1].trim(), to: m[2].trim() };
  return {};
}

/**
 * Извлекает «объект текста» — что искать в карте/AI.
 * Удаляет из текста служебные слова и возвращает оставшееся.
 */
export function extractTextObject(text: string, normalized: string, intent: string): string | undefined {
  let result = normalized;

  // Удаляем ключевые фразы-намерения
  const intentPhrases: Record<string, string[]> = {
    MAP_SEARCH: [
      "найди", "найти", "поищи", "искать", "покажи", "открой", "где", "куда", "на карте", "на картах", "найти", "мне",
      "xaritada", "ko'rsat", "qayerda", "qayerdaligini", "eng yaqin", "yaqin", "topib", "top", "korsat", "menga",
      "show", "find", "where is", "locate", "nearest", "on the map", "near me", "on map",
    ],
    MAP_ROUTE: [
      "маршрут", "как доехать", "как добраться", "как пройти", "как проехать", "доехать", "добраться", "до", "в", "на", "от", "из", "с", "построить", "построй", "проложи",
      "marshrut", "qanday borish", "qanday yetib borish", "yo'l", "ga", "dan",
      "route", "directions", "navigate", "how to get", "from", "to", "build", "show",
    ],
    OCR_TRANSLATE: [
      "переведи", "перевести", "распознай", "скан", "прочитай", "отсканируй", "ocr", "распознавание",
      "tarjima qil", "rasmni", "hujjatni", "matnni", "skanerla", "o'qib ber",
      "translate", "scan", "read", "ocr",
    ],
    JOB_SEARCH: [
      "найди работу", "ищу работу", "поищи работу", "есть работа", "нужна работа", "вакансия", "вакансии", "работа",
      "ish top", "ish qidir", "ish kerak", "vakansiya", "vakansiyalar",
      "find job", "search job", "jobs", "vacancies",
    ],
    AI_CHAT: [
      "объясни", "расскажи", "подскажи", "что делать", "как быть", "что означает", "что значит",
      "как оформить", "как получить", "как сделать", "как найти", "как перевести", "как добраться",
      "tushuntir", "aytib ber", "qanday", "nima qilish",
      "explain", "tell me", "how to",
    ],
  };

  const phrases = intentPhrases[intent] || [];
  // Сортируем по длине (длинные первыми)
  const sorted = phrases.slice().sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    result = result.replace(new RegExp(`\\b${escapeRegex(phrase)}\\b`, "gi"), "");
  }

  // Удаляем стоп-слова RU/UZ/EN
  const stopWords = [
    "пожалуйста", "можно", "мне", "мне бы", "хочу", "нужен", "нужна", "нужно", "могу", "могу ли",
    "сейчас", "прямо", "именно", "просто", "ещё", "еще", "уже", "тоже", "также",
    "ищу", "искать", "найти", "найдите", "покажите",
    "iltimos", "menga", "kerak", "bor", "yoki", "yana",
    "please", "can you", "i need", "i want", "just",
  ];
  for (const word of stopWords) {
    result = result.replace(new RegExp(`\\b${escapeRegex(word)}\\b`, "gi"), "");
  }

  // Удаляем "от X до Y", "откуда куда" и т.п.
  result = result.replace(/^(от|из|с|до|в|на|к|по)\s+/i, "");
  result = result.replace(/\b(поблизости|рядом|недалеко|eng yaqin|yaqin)\b/gi, "");

  // Удаляем время
  result = result.replace(/\b(сегодня|сейчас|сейчас|вчера|завтра|bugun|hozir|today|now)\b/gi, "");

  // Схлопываем пробелы и убираем знаки
  result = result
    .replace(/[?.!,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return result.length >= 2 ? result : undefined;
}

/**
 * Извлекает тип документа.
 */
export function extractDocumentType(text: string, normalized: string): "passport" | "patent" | "migration_card" | "registration" | "contract" | "general" {
  if (rx("\\b(паспорт|pasport|passport)\\b", "i").test(normalized)) return "passport";
  if (rx("\\b(патент|patent)\\b", "i").test(normalized)) return "patent";
  if (rx("\\b(миграцион(ная|ной|ную|ные|ный|ка|ка) карта|migratsion_karta|migration card)\\b", "i").test(normalized)) return "migration_card";
  if (rx("\\b(регистрац(ия|ию|ии|ией)|registratsiya|registration)\\b", "i").test(normalized)) return "registration";
  if (rx("\\b(договор|контракт|шартнома|contract)\\b", "i").test(normalized)) return "contract";
  return "general";
}

/** Главная функция — извлекает все сущности разом. */
export function extractAllEntities(
  text: string,
  normalized: string,
  rule: {
    extractCity?: boolean;
    extractProfession?: boolean;
    extractPlace?: boolean;
    extractOrg?: boolean;
    extractRouteFromTo?: boolean;
    extractTextObject?: boolean;
    extractDocumentType?: boolean;
  },
  intent: string,
): ExtractedEntities {
  const entities: ExtractedEntities = {};

  if (rule.extractCity) {
    const c = extractCity(text, normalized);
    if (c) {
      entities.city = c.city;
      entities.cityCountry = c.country;
    }
  }

  if (rule.extractProfession) {
    const p = extractProfession(text, normalized);
    if (p) {
      entities.profession = p.entry.canonical;
      entities.professionDisplay = {
        ru: p.entry.canonical,
        uz: p.entry.uz,
        en: p.entry.en,
      };
    }
  }

  if (rule.extractPlace) {
    const pl = extractPlace(text, normalized);
    if (pl) {
      entities.placeCategory = pl.category;
      entities.placeDisplay = pl.display;
    }
  }

  if (rule.extractOrg) {
    const o = extractOrg(text, normalized);
    if (o) {
      entities.orgName = o.name;
    }
  }

  if (rule.extractRouteFromTo) {
    const r = extractRouteFromTo(text, normalized);
    if (r.from || r.to) {
      entities.routeFromTo = r;
    }
  }

  if (rule.extractTextObject) {
    const t = extractTextObject(text, normalized, intent);
    if (t) entities.textObject = t;
  }

  if (rule.extractDocumentType) {
    entities.documentType = extractDocumentType(text, normalized);
  }

  return entities;
}