"use client";

export type AIActionType =
  | "GENERAL_CHAT"
  | "MAP_SEARCH"
  | "MAP_ROUTE"
  | "MAP_NEARBY"
  | "MAP_LOCATION"
  | "TRANSLATE"
  | "DOCUMENT_SCAN"
  | "JOB_SEARCH";

export interface AIActionResponse {
  action: AIActionType;
  query?: string;
  destination?: string;
  origin?: string;
  placeType?: string;
  profession?: string;
  city?: string;
  housing?: boolean;
  message?: string;
}

/**
 * Расширенная детекция намерений на стороне фронтенда (пре-процессинг)
 */
export function detectAIAction(message: string): AIActionResponse {
  const text = message.toLowerCase().trim();

  // 0. Детекция поиска работы
  if (/работа|вакансия|ищу работу|найди работу|сварщик|водитель|разнорабочий|строитель|электрик|вахта/i.test(text)) {
    const isHousing = /жиль|вахта|проживан|квартир/i.test(text);
    let extractedCity = "";
    
    const CITIES = ["москв", "спб", "питер", "санкт-петербург", "казан", "новосибирск", "екатеринбург", "тюмен", "ташкент"];
    for (const c of CITIES) {
      if (text.includes(c)) {
        extractedCity = c;
        break;
      }
    }

    return {
      action: "JOB_SEARCH",
      profession: extractPlace(text, ["найди", "работу", "вакансию", "ищу", "в", "с", "жильем"]),
      city: extractedCity,
      housing: isHousing,
      message: "Формирую поиск вакансий..."
    };
  }

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
  return cleaned.replace(/(?:маршрут|как доехать|путь|найди|где находится|покажи|на карте|работу|вакансию)/gi, "").trim();
}