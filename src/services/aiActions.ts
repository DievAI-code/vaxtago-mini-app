"use client";

export type AIActionType =
  | "GENERAL_CHAT"
  | "WORK_SEARCH"
  | "DOCUMENT_HELP"
  | "PHOTO_TRANSLATE"
  | "MAP_SEARCH"
  | "MAP_ROUTE";

export interface ActionChip {
  label: string;
  value: string;
}

export interface AIActionResponse {
  action: AIActionType;
  query?: string;
  destination?: string;
  profession?: string;
  city?: string;
  message?: string;
  chips?: ActionChip[];
}

/**
 * Normalizes Uzbek/Russian input text by removing common typos and suffixes
 */
export function normalizeQueryText(text: string): string {
  let low = text.toLowerCase().trim();

  // Normalize common typos and character variants
  low = low
    .replace(/керакк|керак|кк/g, "керак")
    .replace(/kerakk|kerak|kk$/g, "kerak")
    .replace(/москвада|москвага|москвадан/g, "москва")
    .replace(/moskvada|moskvaga|moskvadan/g, "moskva")
    .replace(/тюменда|тюменга|тюмендан/g, "тюмень")
    .replace(/tyumenda|tyumenga/g, "tyumen")
    .replace(/расмм|расми|сфоткай|фоторасм/g, "расм");

  return low;
}

/**
 * Detects intent from short phrases and messy user inputs
 */
export function detectAIAction(
  message: string,
  previousContext?: { lastAction?: AIActionType; lastQuery?: string }
): AIActionResponse {
  const norm = normalizeQueryText(message);
  const orig = message.trim();

  // Handle follow-up responses when context is available (e.g. user said "ish kerak", AI asked "Which city?", user replies "Москва")
  if (previousContext?.lastAction === "WORK_SEARCH" && !norm.includes("расм") && !norm.includes("адрес") && !norm.includes("манзил")) {
    const CITIES = ["москва", "moskva", "тюмень", "tyumen", "спб", "питер", "санкт-петербург", "казань", "kazan", "новосибирск", "екатеринбург", "ташкент", "toshkent"];
    for (const c of CITIES) {
      if (norm.includes(c)) {
        return {
          action: "WORK_SEARCH",
          city: orig,
          profession: previousContext.lastQuery || "разнорабочий",
          message: `Формирую подборку вакансий в городе ${orig}...`,
        };
      }
    }
  }

  // 1. PHOTO / IMAGE TRANSLATION INTENT
  if (
    /расм|rasm|фото|перевод|таржима|ўгир|переведи|скан|чег|чоп|документни ўқи/i.test(norm) &&
    !/иш|работа|вакансия/i.test(norm)
  ) {
    return {
      action: "PHOTO_TRANSLATE",
      message: "Расмни юборинг.\nМен матнни ўқийман ва таржима қилиб бераман.",
    };
  }

  // 2. DOCUMENT / PATENT HELP INTENT
  if (
    /патент|patent|документ|договор|регистрац|виза|мвд|ҳужжат|hujjat|чеки|чек|паспорт/i.test(norm)
  ) {
    return {
      action: "DOCUMENT_HELP",
      message: "Патент ва миграция бўйича ёрдам бераман.\nҚайси шаҳарда патент олмоқчисиз?",
      chips: [
        { label: "🇷🇺 Москва", value: "Москва патент" },
        { label: "🇷🇺 Санкт-Петербург", value: "СПб патент" },
        { label: "🇷🇺 Тюмень", value: "Тюмень патент" },
        { label: "📄 Штрафлар ва муддат", value: "Патент муддати" },
      ],
    };
  }

  // 3. MAP / ADDRESS SEARCH INTENT (e.g., "тюмень вокзал", "вокзал в москве", "манзил керак")
  if (
    /вокзал|аэропорт|больниц|поликлиник|мфц|метро|рынок|улиц|проспект|где находится|найди|адрес|манзил|vokzal|vokzali|adres/i.test(norm)
  ) {
    let cleanAddress = norm
      .replace(/манзил|керак|где|находится|покажи|найти|адрес|найди|vokzali|vokzal/gi, "")
      .trim();

    if (!cleanAddress) cleanAddress = orig;

    return {
      action: "MAP_SEARCH",
      query: cleanAddress,
      destination: cleanAddress,
      message: `2ГИС харитасидан қидирмоқдаман: "${cleanAddress}"...`,
    };
  }

  // 4. JOB SEARCH INTENT (e.g., "ish kerak", "иш керак", "москва иш", "работа", "сварщик")
  if (
    /иш|ish|работа|вакансия|зарплата|сварщик|водитель|разнорабочий|строитель|электрик|цах|пачка|подработка|иш бор/i.test(norm)
  ) {
    // Extract known city if present
    let extractedCity = "";
    if (/москва|moskva/i.test(norm)) extractedCity = "Москва";
    else if (/тюмень|tyumen/i.test(norm)) extractedCity = "Тюмень";
    else if (/спб|питер|петербург/i.test(norm)) extractedCity = "Санкт-Петербург";
    else if (/казань|kazan/i.test(norm)) extractedCity = "Казань";

    if (extractedCity) {
      return {
        action: "WORK_SEARCH",
        city: extractedCity,
        message: `Албатта ёрдам бераман. ${extractedCity} бўйича вакансияларни қидирмоқдаман...`,
      };
    }

    return {
      action: "WORK_SEARCH",
      message: "Албатта ёрдам бераман.\nҚайси шаҳарда иш керак?",
      chips: [
        { label: "🇷🇺 Москва", value: "Москвада иш" },
        { label: "🇷🇺 Тюмень", value: "Тюменда иш" },
        { label: "🇷🇺 Санкт-Петербург", value: "СПбда иш" },
        { label: "✍️ Бошқа шаҳар", value: "Бошқа шаҳар" },
      ],
    };
  }

  return { action: "GENERAL_CHAT", message: "" };
}