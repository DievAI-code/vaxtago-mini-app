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
 * Детекция намерений на стороне фронтенда
 */
export function detectAIAction(message: string): AIActionResponse {
  const text = message.toLowerCase().trim();

  // 1. Поиск мест и адресов (ЖД вокзал, аэропорт, больница, МФЦ, и т.д.)
  if (
    /вокзал|аэропорт|больниц|поликлиник|мфц|метро|рынок|улиц|проспект|где находится|покажи|найди|адрес/i.test(
      text
    ) &&
    !/работа|ваканси|ищу работу/i.test(text)
  ) {
    // Детекция построения маршрута
    if (/маршрут|как доехать|путь до|проложи дорогу/i.test(text)) {
      return {
        action: "MAP_ROUTE",
        destination: extractCleanQuery(text, ["маршрут", "как доехать", "путь до", "до", "в"]),
        message: "Ищу маршрут на встроенной карте VAQTA AI...",
      };
    }

    // Детекция поиска объектов рядом
    if (/рядом|поблизости/i.test(text)) {
      return {
        action: "MAP_NEARBY",
        query: extractCleanQuery(text, ["рядом", "поблизости", "найди"]),
        message: "Ищу ближайшие объекты на карте VAQTA AI...",
      };
    }

    return {
      action: "MAP_SEARCH",
      query: extractCleanQuery(text, ["покажи", "найди", "где находится", "адрес"]),
      message: "Открываю карту VAQTA AI...",
    };
  }

  // 2. Детекция поиска работы
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
      profession: extractCleanQuery(text, ["найди", "работу", "вакансию", "ищу", "в", "с", "жильем"]),
      city: extractedCity,
      housing: isHousing,
      message: "Формирую поиск вакансий..."
    };
  }

  return { action: "GENERAL_CHAT", message: "" };
}

function extractCleanQuery(text: string, stopWords: string[]): string {
  let cleaned = text;
  stopWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    cleaned = cleaned.replace(regex, "");
  });
  return cleaned
    .replace(/(?:покажи|найди|где находится|адрес|маршрут|как доехать|путь)/gi, "")
    .trim();
}