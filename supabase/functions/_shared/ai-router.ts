/// <reference path="../deno-env.d.ts" />

export type Intent =
  | "GENERAL_CHAT"
  | "LOCATION_SEARCH"
  | "ROUTE_BUILD"
  | "VACANCY_SEARCH"
  | "OCR_DOCUMENT"
  | "TRANSLATION"
  | "EMPLOYER_CHECK"
  | "LEGAL_HELP";

export interface AIResult {
  text: string;
  intent: Intent;
  action_data?: any;
  model: string;
}

export function detectIntent(text: string): Intent {
  const low = text.toLowerCase();
  
  if (/маршрут|как доехать|добраться|путь/i.test(low)) return "ROUTE_BUILD";
  if (/где|найти|покажи|адрес|вокзал|аэропорт/i.test(low)) return "LOCATION_SEARCH";
  if (/работа|вакансия|иш|ish/i.test(low)) return "VACANCY_SEARCH";
  if (/переведи|распознай|скан|фото/i.test(low)) return "OCR_DOCUMENT";
  if (/закон|право|юрист|штраф/i.test(low)) return "LEGAL_HELP";
  if (/проверь работодателя|инн|огрн/i.test(low)) return "EMPLOYER_CHECK";
  
  return "GENERAL_CHAT";
}

export const VAXTAGO_SYSTEM_PROMPT = `Ты — AI-помощник VAQTA AI.
Твоя задача: помогать гражданам Центральной Азии безопасно работать в России.
Помогай с:
* поиском работы
* вакансиями
* документами
* переводами RU ↔ UZ
* миграционными вопросами
* проверкой работодателей
* маршрутами
Отвечай понятно, кратко и практично.
Всегда отвечай на языке пользователя: русский или узбекский.`;