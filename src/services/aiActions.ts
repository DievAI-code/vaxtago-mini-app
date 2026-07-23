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
 */
export function classifyIntent(message: string): AIIntent {
  const text = message.toLowerCase();

  if (
    text.includes("карта") ||
    text.includes("адрес") ||
    text.includes("найди") ||
    text.includes("где находится") ||
    text.includes("покажи на карте") ||
    text.includes("kartada") ||
    text.includes("харита")
  ) {
    return "map";
  }

  if (
    text.includes("переведи") ||
    text.includes("перевод") ||
    text.includes("translate") ||
    text.includes("tarjima") ||
    text.includes("таржима")
  ) {
    return "translate";
  }

  if (
    text.includes("паспорт") ||
    text.includes("документ") ||
    text.includes("виза") ||
    text.includes("регистрация") ||
    text.includes("патент") ||
    text.includes("hujjat") ||
    text.includes("ҳуҷҷат")
  ) {
    return "document";
  }

  if (
    text.includes("работа") ||
    text.includes("вакансия") ||
    text.includes("вахта") ||
    text.includes("иш") ||
    text.includes("кор") ||
    text.includes("job")
  ) {
    return "jobs";
  }

  return "general";
}

/**
 * Детектор действий AI с подробным ответом
 */
export function detectAIAction(message: string): AIActionResponse {
  const lowerText = message.toLowerCase().trim();

  // Поиск на карте (RU, UZ, EN, TJ)
  if (
    lowerText.includes("покажи на карте") ||
    lowerText.includes("найди адрес") ||
    lowerText.includes("где находится") ||
    lowerText.includes("карта") ||
    lowerText.includes("map") ||
    lowerText.includes("location") ||
    lowerText.includes("kartada") ||
    lowerText.includes("ko'rsat") ||
    lowerText.includes("дар харита") ||
    lowerText.includes("нишон деҳ") ||
    lowerText.includes("show on map")
  ) {
    return {
      action: "MAP_SEARCH",
      intent: "map",
      query: extractSearchQuery(message),
      message: "Ищу адрес на карте...",
      success: true,
    };
  }

  // Построение маршрута
  if (
    lowerText.includes("построй маршрут") ||
    lowerText.includes("как доехать") ||
    lowerText.includes("маршрут") ||
    lowerText.includes("route") ||
    lowerText.includes("direction") ||
    lowerText.includes("йўл") ||
    lowerText.includes("build route") ||
    lowerText.includes("йўналиш")
  ) {
    return {
      action: "BUILD_ROUTE",
      intent: "map",
      query: extractRouteQuery(message),
      message: "Строю маршрут...",
      success: true,
    };
  }

  // Перевод
  if (
    lowerText.includes("переведи") ||
    lowerText.includes("translate") ||
    lowerText.includes("tarjima") ||
    lowerText.includes("таржима") ||
    lowerText.includes("translation")
  ) {
    return {
      action: "TRANSLATE",
      intent: "translate",
      query: message,
      language: detectLanguage(message),
      message: "Выполняю перевод...",
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
    lowerText.includes("ҳуҷҷат") ||
    lowerText.includes("hujjat") ||
    lowerText.includes("document")
  ) {
    return {
      action: "DOCUMENT_SCAN",
      intent: "document",
      query: message,
      message: "Открываю сканер документов...",
      success: true,
    };
  }

  // Поиск работы
  if (
    lowerText.includes("ищу работу") ||
    lowerText.includes("вакансии") ||
    lowerText.includes("работа") ||
    lowerText.includes("job") ||
    lowerText.includes("ish") ||
    lowerText.includes("кор") ||
    lowerText.includes("вакансия")
  ) {
    return {
      action: "JOB_SEARCH",
      intent: "jobs",
      query: extractJobQuery(message),
      message: "Ищу подходящие вакансии...",
      success: true,
    };
  }

  // Проверка работодателя
  if (
    lowerText.includes("проверь работодателя") ||
    lowerText.includes("проверка компании") ||
    lowerText.includes("employer") ||
    lowerText.includes("корфармо") ||
    lowerText.includes("check employer")
  ) {
    return {
      action: "EMPLOYER_CHECK",
      intent: "jobs",
      query: extractCompanyQuery(message),
      message: "Проверяю данные компании...",
      success: true,
    };
  }

  return {
    action: "GENERAL_CHAT",
    intent: "general",
    query: message,
    message: "Обрабатываю запрос...",
    success: true,
  };
}

/**
 * Функция detectIntent — синоним для detectAIAction, возвращающая объект AIActionResponse
 */
export function detectIntent(message: string): AIActionResponse {
  return detectAIAction(message);
}

function extractSearchQuery(text: string): string {
  const patterns = [
    /(?:покажи|найди|где|карта|покажи на карте|на карте)\s+(.+)/i,
    /(?:show|find|where|map|show on map)\s+(.+)/i,
    /(?:кўрсат|топ|қаерда|харита|картада|kartada)\s+(.+)/i,
    /(?:нишон|дар|харита|дар харита)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]?.trim()) return match[1].trim();
  }

  return text;
}

function extractRouteQuery(text: string): string {
  const patterns = [
    /(?:построй|маршрут|как доехать до|доехать до|построй маршрут до)\s+(.+)/i,
    /(?:build|route|direction|build route to)\s+(.+)/i,
    /(?:йўл|маршрут|йўналиш)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]?.trim()) return match[1].trim();
  }

  return text;
}

function extractJobQuery(text: string): string {
  const patterns = [
    /(?:ищу|вакансии|работа|найти работу)\s+(.+)/i,
    /(?:looking for|vacancy|job|find job)\s+(.+)/i,
    /(?:иш|кор|вакансия)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]?.trim()) return match[1].trim();
  }

  return text;
}

function extractCompanyQuery(text: string): string {
  const patterns = [
    /(?:проверь|компания|работодатель|проверка компании)\s+(.+)/i,
    /(?:check|company|employer)\s+(.+)/i,
    /(?:текшир|компания|корфармо)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]?.trim()) return match[1].trim();
  }

  return text;
}

function detectLanguage(text: string): string {
  if (/[а-яё]/i.test(text)) return "ru";
  if (/[ўғқҳәөү]/i.test(text)) return "uz";
  if (/[ӣӯҷҳҒҚ]/i.test(text)) return "tg";
  if (/[өүҡң]/i.test(text)) return "ky";
  if (/[a-z]/i.test(text)) return "en";
  return "ru";
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