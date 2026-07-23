"use client";

export type AIActionType =
  | "GENERAL_CHAT"
  | "MAP_SEARCH"
  | "MAP_ROUTE"
  | "MAP_NEARBY"
  | "MAP_LOCATION"
  | "TRANSLATE"
  | "DOCUMENT_SCAN";

export interface AIActionResponse {
  action: AIActionType;
  query?: string;
  destination?: string;
  origin?: string;
  placeType?: string;
  message?: string;
}

/**
 * Расширенная детекция намерений на стороне фронтенда (пре-процессинг)
 */
export function detectAIAction(message: string): AIActionResponse {
  const text = message.toLowerCase().trim();

  // 1. Построение маршрута
  if (/маршрут|как доехать|путь до|проложи дорогу|йўналиш|бағыт|route/i.test(text)) {
    return {
      action: "MAP_ROUTE",
      destination: extractPlace(text, ["до", "в", "на", "to", "ga"]),
      message: "Секунду, строю маршрут..."
    };
  }

  // 2. Поиск ближайших мест
  if (/рядом|поблизости|яқин|жақын|nearby|around/i.test(text)) {
    const types = {
      "больница": "hospital",
      "вокзал": "station",
      "мфц": "mfc",
      "центр": "center",
      "магазин": "shop"
    };
    let foundType = "place";
    for (const [key, val] of Object.entries(types)) {
      if (text.includes(key)) foundType = val;
    }
    return {
      action: "MAP_NEARBY",
      placeType: foundType,
      message: "Ищу ближайшие объекты..."
    };
  }

  // 3. Поиск конкретного адреса
  if (/где находится|найди адрес|покажи на карте|картадан|map/i.test(text)) {
    return {
      action: "MAP_SEARCH",
      query: extractPlace(text, ["адрес", "находится", "где", "location"]),
      message: "Ищу местоположение на карте..."
    };
  }

  // 4. Определение текущего местоположения
  if (/где я|мое местоположение|менинг жойлашувим|мен қайдамын/i.test(text)) {
    return {
      action: "MAP_LOCATION",
      message: "Определяю ваши координаты..."
    };
  }

  return { action: "GENERAL_CHAT", message: "" };
}

function extractPlace(text: string, stopWords: string[]): string {
  let cleaned = text;
  stopWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, "");
  });
  return cleaned.replace(/(?:маршрут|как доехать|путь|найди|где находится|покажи|на карте)/gi, "").trim();
}