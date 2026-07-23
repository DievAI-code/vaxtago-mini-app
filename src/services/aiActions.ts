"use client";

export type AIAction =
  | "GENERAL_CHAT"
  | "MAP_SEARCH"
  | "BUILD_ROUTE"
  | "TRANSLATE"
  | "DOCUMENT_SCAN"
  | "JOB_SEARCH"
  | "EMPLOYER_CHECK";

export type AIIntent = "map" | "translate" | "document" | "jobs" | "general";

export interface AIActionResponse {
  action: AIAction;
  intent?: AIIntent;
  query?: string;
  coordinates?: [number, number];
  address?: string;
  language?: string;
  message?: string;
  success?: boolean;
  data?: unknown;
}

/**
 * Классификатор коротких интентов для VAQTA AI
 * Поддержка трех языков: RU, EN, KK
 */
export function classifyIntent(message: string): AIIntent {
  const text = message.toLowerCase();

  // Поиск адреса/карты (RU, EN, KK, UZ, TJ)
  if (
    text.includes("карта") ||
    text.includes("адрес") ||
    text.includes("найди") ||
    text.includes("где находится") ||
    text.includes("покажи на карте") ||
    text.includes("map") ||
    text.includes("location") ||
    text.includes("route") ||
    text.includes("карор") ||
    text.includes("харита") ||
    text.includes("картада")
  ) {
    return "map";
  }

  // Перевод (RU, EN, KK, UZ, TJ)
  if (
    text.includes("переведи") ||
    text.includes("перевод") ||
    text.includes("translate") ||
    text.includes("translation") ||
    text.includes("аудар") ||
    text.includes("аудару") ||
    text.includes("аударма") ||
    text.includes("tarjima")
  ) {
    return "translate";
  }

  // Документы (RU, EN, KK, UZ, TJ)
  if (
    text.includes("паспорт") ||
    text.includes("документ") ||
    text.includes("виза") ||
    text.includes("регистрация") ||
    text.includes("патент") ||
    text.includes("құжат") ||
    text.includes("құжаттар") ||
    text.includes("document") ||
    text.includes("passport") ||
    text.includes("hujjat")
  ) {
    return "document";
  }

  // Вакансии и жұмыс (RU, EN, KK, UZ, TJ)
  if (
    text.includes("работа") ||
    text.includes("вакансия") ||
    text.includes("вахта") ||
    text.includes("жұмыс") ||
    text.includes("жұмыс іздеу") ||
    text.includes("job") ||
    text.includes("vacancy") ||
    text.includes("work") ||
    text.includes("ish")
  ) {
    return "jobs";
  }

  return "general";
}

/**
 * Детектор действий AI с подробным ответом для RU, EN, KK
 */
export function detectAIAction(message: string): AIActionResponse {
  const lowerText = message.toLowerCase().trim();

  // Поиск на карте
  if (
    lowerText.includes("покажи на карте") ||
    lowerText.includes("найди адрес") ||
    lowerText.includes("где находится") ||
    lowerText.includes("карта") ||
    lowerText.includes("map") ||
    lowerText.includes("show on map") ||
    lowerText.includes("картадан көрсет") ||
    lowerText.includes("мекенжайды тап") ||
    lowerText.includes("қайда орналасқан") ||
    lowerText.includes("дар харита") ||
    lowerText.includes("kartada")
  ) {
    return {
      action: "MAP_SEARCH",
      intent: "map",
      query: extractSearchQuery(message),
      message: getLocalizedMessage("map_search", detectLanguage(message)),
      success: true,
    };
  }

  // Построение маршрута
  if (
    lowerText.includes("построй маршрут") ||
    lowerText.includes("как доехать") ||
    lowerText.includes("маршрут") ||
    lowerText.includes("build route") ||
    lowerText.includes("route") ||
    lowerText.includes("бағыт салу") ||
    lowerText.includes("қалай жетуге болады") ||
    lowerText.includes("йўналиш")
  ) {
    return {
      action: "BUILD_ROUTE",
      intent: "map",
      query: extractRouteQuery(message),
      message: getLocalizedMessage("build_route", detectLanguage(message)),
      success: true,
    };
  }

  // Перевод
  if (
    lowerText.includes("переведи") ||
    lowerText.includes("translate") ||
    lowerText.includes("аудар") ||
    lowerText.includes("аудару") ||
    lowerText.includes("аударма") ||
    lowerText.includes("tarjima")
  ) {
    return {
      action: "TRANSLATE",
      intent: "translate",
      query: message,
      language: detectLanguage(message),
      message: getLocalizedMessage("translate", detectLanguage(message)),
      success: true,
    };
  }

  // Сканирование документов
  if (
    lowerText.includes("сканируй") ||
    lowerText.includes("распознай") ||
    lowerText.includes("скан") ||
    lowerText.includes("scan") ||
    lowerText.includes("документ") ||
    lowerText.includes("құжат") ||
    lowerText.includes("hujjat")
  ) {
    return {
      action: "DOCUMENT_SCAN",
      intent: "document",
      query: message,
      message: getLocalizedMessage("document_scan", detectLanguage(message)),
      success: true,
    };
  }

  // Поиск работы
  if (
    lowerText.includes("ищу работу") ||
    lowerText.includes("вакансии") ||
    lowerText.includes("работа") ||
    lowerText.includes("job") ||
    lowerText.includes("find job") ||
    lowerText.includes("жұмыс") ||
    lowerText.includes("жұмыс керек") ||
    lowerText.includes("жұмыс іздеу") ||
    lowerText.includes("ish")
  ) {
    return {
      action: "JOB_SEARCH",
      intent: "jobs",
      query: extractJobQuery(message),
      message: getLocalizedMessage("job_search", detectLanguage(message)),
      success: true,
    };
  }

  // Проверка работодателя
  if (
    lowerText.includes("проверь работодателя") ||
    lowerText.includes("проверка компании") ||
    lowerText.includes("check employer") ||
    lowerText.includes("жұмыс берушіні тексеру") ||
    lowerText.includes("компанияны тексеру")
  ) {
    return {
      action: "EMPLOYER_CHECK",
      intent: "jobs",
      query: extractCompanyQuery(message),
      message: getLocalizedMessage("employer_check", detectLanguage(message)),
      success: true,
    };
  }

  return {
    action: "GENERAL_CHAT",
    intent: "general",
    query: message,
    message: getLocalizedMessage("general", detectLanguage(message)),
    success: true,
  };
}

export function detectIntent(message: string): AIActionResponse {
  return detectAIAction(message);
}

export function detectLanguage(text: string): string {
  // Казахские специфические буквы: Ә, і, Ң, Ғ, Ү, Ұ, Қ, Ө, Һ
  if (/[әіңғүұқөһжұмысқұжат]/i.test(text)) return "kk";
  if (/[а-яё]/i.test(text)) return "ru";
  if (/[a-z]/i.test(text)) return "en";
  return "ru";
}

function getLocalizedMessage(type: string, lang: string): string {
  const msgs: Record<string, Record<string, string>> = {
    map_search: {
      ru: "Ищу адрес на карте...",
      en: "Searching for location on map...",
      kk: "Картадан мекенжайды іздеудемін...",
    },
    build_route: {
      ru: "Строю маршрут...",
      en: "Building route...",
      kk: "Бағыт салудамын...",
    },
    translate: {
      ru: "Выполняю перевод...",
      en: "Translating text...",
      kk: "Аударма жасаудамын...",
    },
    document_scan: {
      ru: "Открываю сканер документов...",
      en: "Opening document scanner...",
      kk: "Құжат сканерін ашудамын...",
    },
    job_search: {
      ru: "Ищу подходящие вакансии...",
      en: "Searching for relevant jobs...",
      kk: "Сәйкес бос орындарды іздеудемін...",
    },
    employer_check: {
      ru: "Проверяю данные компании...",
      en: "Checking company details...",
      kk: "Компания мәліметтерін тексерудемін...",
    },
    general: {
      ru: "Обрабатываю запрос...",
      en: "Processing request...",
      kk: "Сұрауды өңдеудемін...",
    },
  };

  return msgs[type]?.[lang] || msgs[type]?.ru || "Processing...";
}

function extractSearchQuery(text: string): string {
  const patterns = [
    /(?:покажи|найди|где|карта|покажи на карте|на карте|картадан көрсет|мекенжайды тап)\s+(.+)/i,
    /(?:show|find|where|map|show on map)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]?.trim()) return match[1].trim();
  }

  return text;
}

function extractRouteQuery(text: string): string {
  const patterns = [
    /(?:построй|маршрут|как доехать до|бағыт салу|қалай жетуге болады)\s+(.+)/i,
    /(?:build|route|direction|build route to)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]?.trim()) return match[1].trim();
  }

  return text;
}

function extractJobQuery(text: string): string {
  const patterns = [
    /(?:ищу|вакансии|работа|найти работу|жұмыс|жұмыс іздеу)\s+(.+)/i,
    /(?:looking for|vacancy|job|find job)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]?.trim()) return match[1].trim();
  }

  return text;
}

function extractCompanyQuery(text: string): string {
  const patterns = [
    /(?:проверь|компания|работодатель|проверка компании|жұмыс берушіні тексеру)\s+(.+)/i,
    /(?:check|company|employer)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]?.trim()) return match[1].trim();
  }

  return text;
}

export async function executeAIAction(actionResponse: AIActionResponse): Promise<any> {
  return {
    action: actionResponse.action,
    intent: actionResponse.intent,
    query: actionResponse.query,
    message: actionResponse.message,
    success: actionResponse.success ?? true,
    data: actionResponse.data,
  };
}