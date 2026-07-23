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
  
  // Поиск на карте
  if (lowerText.includes("покажи на карте") || 
      lowerText.includes("найди адрес") ||
      lowerText.includes("где находится") ||
      lowerText.includes("карта") ||
      lowerText.includes("map") ||
      lowerText.includes("location") ||
      lowerText.includes("kartada") ||
      lowerText.includes("дар харита") ||
      lowerText.includes("show on map")) {
    return {
      action: "MAP_SEARCH",
      query: extractSearchQuery(message),
      message: "Нашёл адрес на карте"
    };
  }
  
  // Построение маршрута
  if (lowerText.includes("построй маршрут") ||
      lowerText.includes("как доехать") ||
      lowerText.includes("маршрут") ||
      lowerText.includes("route") ||
      lowerText.includes("direction") ||
      lowerText.includes("йўл") ||
      lowerText.includes("маршрут") ||
      lowerText.includes("build route")) {
    return {
      action: "BUILD_ROUTE", 
      query: extractRouteQuery(message),
      message: "Строю маршрут"
    };
  }
  
  // Перевод
  if (lowerText.includes("переведи") ||
      lowerText.includes("translate") ||
      lowerText.includes("tarjima") ||
      lowerText.includes("таржима") ||
      lowerText.includes("translation")) {
    return {
      action: "TRANSLATE",
      query: message,
      language: detectLanguage(message),
      message: "Перевожу текст"
    };
  }
  
  // Сканирование документов
  if (lowerText.includes("сканируй") ||
      lowerText.includes("распознай") ||
      lowerText.includes("скан") ||
      lowerText.includes("scan") ||
      lowerText.includes("документ") ||
      lowerText.includes("ҳуҷҷат") ||
      lowerText.includes("document")) {
    return {
      action: "DOCUMENT_SCAN",
      query: message,
      message: "Сканирую документ"
    };
  }
  
  // Поиск работы
  if (lowerText.includes("ищу работу") ||
      lowerText.includes("вакансии") ||
      lowerText.includes("работа") ||
      lowerText.includes("job") ||
      lowerText.includes("ish") ||
      lowerText.includes("кор") ||
      lowerText.includes("вакансия")) {
    return {
      action: "JOB_SEARCH",
      query: extractJobQuery(message),
      message: "Ищу вакансии"
    };
  }
  
  // Проверка работодателя
  if (lowerText.includes("проверь работодателя") ||
      lowerText.includes("проверка компании") ||
      lowerText.includes("employer") ||
      lowerText.includes("корфармо") ||
      lowerText.includes("check employer")) {
    return {
      action: "EMPLOYER_CHECK",
      query: extractCompanyQuery(message),
      message: "Проверяю работодателя"
    };
  }
  
  // Общий чат по умолчанию
  return {
    action: "GENERAL_CHAT",
    query: message,
    message: "Отвечаю на вопрос"
  };
}

function extractSearchQuery(text: string): string {
  const patterns = [
    /(?:покажи|найди|где|карта)\s+(.+)/i,
    /(?:show|find|where|map)\s+(.+)/i,
    /(?:кўрсат|топ|қаерда|харита)\s+(.+)/i,
    /(?:нишон|дар|харита)\s+(.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  
  return text;
}

function extractRouteQuery(text: string): string {
  const patterns = [
    /(?:построй|маршрут|доехать)\s+(.+)/i,
    /(?:build|route|direction)\s+(.+)/i,
    /(?:йўл|маршрут)\s+(.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  
  return text;
}

function extractJobQuery(text: string): string {
  const patterns = [
    /(?:ищу|вакансии|работа)\s+(.+)/i,
    /(?:looking|vacancy|job)\s+(.+)/i,
    /(?:иш|кор|вакансия)\s+(.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  
  return text;
}

function extractCompanyQuery(text: string): string {
  const patterns = [
    /(?:проверь|компания|работодатель)\s+(.+)/i,
    /(?:check|company|employer)\s+(.+)/i,
    /(?:текшир|компания|корфармо)\s+(.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
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
  switch (actionResponse.action) {
    case "MAP_SEARCH":
      return await handleMapSearch(actionResponse.query);
    case "BUILD_ROUTE":
      return await handleBuildRoute(actionResponse.query);
    case "TRANSLATE":
      return await handleTranslate(actionResponse.query, actionResponse.language);
    default:
      return { action: actionResponse.action, query: actionResponse.query };
  }
}

async function handleMapSearch(query: string | undefined) {
  if (!query) return { error: "No search query" };
  
  try {
    const coordinates = await geocodeAddress(query);
    return {
      action: "MAP_SEARCH",
      query,
      coordinates,
      message: `Нашёл местоположение: ${query}`
    };
  } catch (error) {
    return {
      action: "MAP_SEARCH",
      query,
      error: "Не удалось найти адрес"
    };
  }
}

async function handleBuildRoute(query: string | undefined) {
  if (!query) return { error: "No route query" };
  
  try {
    const coordinates = await geocodeAddress(query);
    return {
      action: "BUILD_ROUTE",
      query,
      coordinates,
      message: `Построил маршрут до: ${query}`
    };
  } catch (error) {
    return {
      action: "BUILD_ROUTE",
      query,
      error: "Не удалось построить маршрут"
    };
  }
}

async function handleTranslate(query: string | undefined, language: string = "ru") {
  if (!query) return { error: "No text to translate" };
  
  return {
    action: "TRANSLATE",
    query,
    language,
    message: `Перевожу на ${language}`
  };
}

// Заглушка для геокодинга
async function geocodeAddress(address: string): Promise<[number, number]> {
  // Реализация будет в maps.ts
  return [0, 0];
}