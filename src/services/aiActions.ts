"use client";

export type AIAction = 
  | "MAP_SEARCH" 
  | "MAP_ROUTE"
  | "TRANSLATE"
  | "DOCUMENT_SCAN"
  | "JOB_SEARCH"
  | "EMPLOYER_CHECK"
  | "GENERAL_CHAT";

export interface AIActionResponse {
  action: AIAction;
  query?: string;
  coordinates?: [number, number];
  address?: string;
  language?: string;
  message?: string;
}

export function detectIntent(text: string): AIActionResponse {
  const lowerText = text.toLowerCase().trim();
  
  // Поиск на карте
  if (lowerText.includes("покажи на карте") || 
      lowerText.includes("найди адрес") ||
      lowerText.includes("где находится") ||
      lowerText.includes("карта") ||
      lowerText.includes("map") ||
      lowerText.includes("location")) {
    return {
      action: "MAP_SEARCH",
      query: extractLocationQuery(text)
    };
  }
  
  // Построение маршрута
  if (lowerText.includes("построить маршрут") ||
      lowerText.includes("как доехать") ||
      lowerText.includes("маршрут") ||
      lowerText.includes("route") ||
      lowerText.includes("direction")) {
    return {
      action: "MAP_ROUTE", 
      query: extractLocationQuery(text)
    };
  }
  
  // Перевод
  if (lowerText.includes("переведи") ||
      lowerText.includes("translate") ||
      lowerText.includes("tarjima") ||
      lowerText.includes("таржима")) {
    return {
      action: "TRANSLATE",
      query: text,
      language: detectLanguage(text)
    };
  }
  
  // Сканирование документов
  if (lowerText.includes("сканируй") ||
      lowerText.includes("распознай") ||
      lowerText.includes("скан") ||
      lowerText.includes("scan") ||
      lowerText.includes("документ")) {
    return {
      action: "DOCUMENT_SCAN",
      query: text
    };
  }
  
  // Поиск работы
  if (lowerText.includes("ищу работу") ||
      lowerText.includes("вакансии") ||
      lowerText.includes("работа") ||
      lowerText.includes("job") ||
      lowerText.includes("ish")) {
    return {
      action: "JOB_SEARCH",
      query: extractJobQuery(text)
    };
  }
  
  // Проверка работодателя
  if (lowerText.includes("проверь работодателя") ||
      lowerText.includes("проверка компании") ||
      lowerText.includes("employer") ||
      lowerText.includes("корфармо")) {
    return {
      action: "EMPLOYER_CHECK",
      query: extractCompanyQuery(text)
    };
  }
  
  // Общий чат по умолчанию
  return {
    action: "GENERAL_CHAT",
    query: text
  };
}

function extractLocationQuery(text: string): string {
  const patterns = [
    /(?:покажи|найди|где|маршрут|карта)\s+(.+)/i,
    /(?:show|find|where|route|map)\s+(.+)/i,
    /(?:кўрсат|топ|қаерда|маршрут)\s+(.+)/i
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
    /(?:ишлайман|вакансия|иш)\s+(.+)/i
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
  if (/[a-z]/i.test(text)) return "en";
  return "ru";
}

// Функция для выполнения действий
export async function executeAIAction(actionResponse: AIActionResponse): Promise<any> {
  switch (actionResponse.action) {
    case "MAP_SEARCH":
      return await handleMapSearch(actionResponse.query);
    case "MAP_ROUTE":
      return await handleMapRoute(actionResponse.query);
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

async function handleMapRoute(query: string | undefined) {
  if (!query) return { error: "No route query" };
  
  try {
    const coordinates = await geocodeAddress(query);
    return {
      action: "MAP_ROUTE",
      query,
      coordinates,
      message: `Построил маршрут до: ${query}`
    };
  } catch (error) {
    return {
      action: "MAP_ROUTE",
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

// Заглушка для геокодинга (реализация в maps.ts)
async function geocodeAddress(address: string): Promise<[number, number]> {
  // Реализация будет в maps.ts
  return [0, 0];
}