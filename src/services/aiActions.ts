"use client";

export type AIAction =
  | "GENERAL_CHAT"
  | "MAP_SEARCH"
  | "BUILD_ROUTE"
  | "TRANSLATE"
  | "DOCUMENT_SCAN"
  | "JOB_SEARCH"
  | "EMPLOYER_CHECK";

export interface AIActionResponse {
  action: AIAction;
  query?: string;
  coordinates?: [number, number];
  address?: string;
  language?: string;
  message?: string;
}

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
      query: extractSearchQuery(message),
      message: "Ищу адрес на карте..."
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
      query: extractRouteQuery(message),
      message: "Строю маршрут..."
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
      query: message,
      language: detectLanguage(message),
      message: "Выполняю перевод..."
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
      query: message,
      message: "Открываю сканер документов..."
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
      query: extractJobQuery(message),
      message: "Ищу подходящие вакансии..."
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
      query: extractCompanyQuery(message),
      message: "Проверяю данные компании..."
    };
  }

  return {
    action: "GENERAL_CHAT",
    query: message,
    message: "Обрабатываю запрос..."
  };
}

function extractSearchQuery(text: string): string {
  const patterns = [
    /(?:покажи|найди|где|карта|покажи на карте|на карте)\s+(.+)/i,
    /(?:show|find|where|map|show on map)\s+(.+)/i,
    /(?:кўрсат|топ|қаерда|харита|картада|kartada)\s+(.+)/i,
    /(?:нишон|дар|харита|дар харита)\s+(.+)/i
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
    /(?:йўл|маршрут|йўналиш)\s+(.+)/i
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
    /(?:иш|кор|вакансия)\s+(.+)/i
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
    /(?:текшир|компания|корфармо)\s+(.+)/i
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
  return { action: actionResponse.action, query: actionResponse.query, message: actionResponse.message };
}