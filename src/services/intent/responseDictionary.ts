/**
 * Словарь коротких ответов на intents.
 * Используется для построения поля reply в IntentResult.
 *
 * Поддержка: ru / uz / en.
 */

import type { IntentType } from "./intentDictionary";
import type { ExtractedEntities } from "./entityExtractor";

type Lang = "ru" | "uz" | "en";

type ReplyKey = "greeting" | "searching" | "found" | "translating" | "checking" | "route" | "emergency" | "opening" | "premium" | "navigating" | "thinking" | "answer";

const TEMPLATES: Record<IntentType, Record<Lang, string>> = {
  MAP_SEARCH: {
    ru: "Ищу {what} на карте",
    uz: "Xaritada {what} izlayapman",
    en: "Searching {what} on the map",
  },
  MAP_ROUTE: {
    ru: "Строю маршрут {to}",
    uz: "Marshrut quryapman {to}",
    en: "Building route to {to}",
  },
  JOB_SEARCH: {
    ru: "Ищу вакансии {what} {where}",
    uz: "Vakansiyalar izlayapman {what} {where}",
    en: "Searching jobs {what} {where}",
  },
  OCR_TRANSLATE: {
    ru: "Открываю сканер для перевода {what}",
    uz: "Tarjima uchun skaner ochmoqda {what}",
    en: "Opening scanner for translation {what}",
  },
  DOCUMENT_CHECK: {
    ru: "Проверяю документ",
    uz: "Hujjatni tekshirmoqdaman",
    en: "Checking document",
  },
  EMPLOYER_CHECK: {
    ru: "Проверяю работодателя {what}",
    uz: "Ish beruvchini tekshirmoqdaman {what}",
    en: "Checking employer {what}",
  },
  AI_CHAT: {
    ru: "Думаю над ответом...",
    uz: "Javob ustida o'ylayapman...",
    en: "Thinking about the answer...",
  },
  SOS: {
    ru: "Открываю экстренную помощь",
    uz: "Shoshilinch yordamni ochmoqda",
    en: "Opening emergency help",
  },
  PREMIUM: {
    ru: "Открываю Premium",
    uz: "Premium ochmoqda",
    en: "Opening Premium",
  },
  NAVIGATE_HOME: { ru: "Открываю главную", uz: "Bosh sahifani ochmoqda", en: "Opening home" },
  NAVIGATE_AI: { ru: "Открываю AI-чат", uz: "AI chat ochmoqda", en: "Opening AI chat" },
  NAVIGATE_SCANNER: { ru: "Открываю сканер", uz: "Skaner ochmoqda", en: "Opening scanner" },
  NAVIGATE_JOBS: { ru: "Открываю вакансии", uz: "Vakansiyalarni ochmoqda", en: "Opening jobs" },
  NAVIGATE_MAP: { ru: "Открываю карту", uz: "Xaritani ochmoqda", en: "Opening map" },
  NAVIGATE_PROFILE: { ru: "Открываю профиль", uz: "Profilni ochmoqda", en: "Opening profile" },
  NAVIGATE_TRACKER: { ru: "Открываю календарь патента", uz: "Patent kalendarini ochmoqda", en: "Opening patent calendar" },
  NAVIGATE_SOS: { ru: "Открываю SOS", uz: "SOS ochmoqda", en: "Opening SOS" },
  NAVIGATE_SETTINGS: { ru: "Открываю настройки", uz: "Sozlamalarni ochmoqda", en: "Opening settings" },
  NAVIGATE_ADMIN: { ru: "Открываю админ-панель", uz: "Admin panelini ochmoqda", en: "Opening admin panel" },
  NAVIGATE_HISTORY: { ru: "Открываю историю", uz: "Tarixni ochmoqda", en: "Opening history" },
  NAVIGATE_PREMIUM: { ru: "Открываю Premium", uz: "Premium ochmoqda", en: "Opening Premium" },
  VOICE_SETTINGS: { ru: "Открываю голосовые настройки", uz: "Ovoz sozlamalarini ochmoqda", en: "Opening voice settings" },
  WEATHER: { ru: "Показываю погоду в {where}", uz: "{where}da ob-havoni ko'rsatmoqda", en: "Showing weather in {where}" },
  CALCULATE_90_180: { ru: "Открываю калькулятор 90/180", uz: "90/180 kalkulyatorini ochmoqda", en: "Opening 90/180 calculator" },
  OPEN_VACANCIES_LIST: { ru: "Открываю список вакансий", uz: "Vakansiyalar ro'yxatini ochmoqda", en: "Opening jobs list" },
};

const SHORT_REPLIES: Record<IntentType, Record<Lang, string>> = {
  MAP_SEARCH: { ru: "Ищу...", uz: "Qidiryapman...", en: "Searching..." },
  MAP_ROUTE: { ru: "Строю маршрут...", uz: "Marshrut...", en: "Building route..." },
  JOB_SEARCH: { ru: "Ищу вакансии...", uz: "Vakansiya qidiryapman...", en: "Searching jobs..." },
  OCR_TRANSLATE: { ru: "Распознаю и перевожу...", uz: "Tarjima qilayapman...", en: "Recognizing..." },
  DOCUMENT_CHECK: { ru: "Проверяю...", uz: "Tekshiryapman...", en: "Checking..." },
  EMPLOYER_CHECK: { ru: "Проверяю...", uz: "Tekshiryapman...", en: "Checking..." },
  AI_CHAT: { ru: "Думаю...", uz: "O'ylayapman...", en: "Thinking..." },
  SOS: { ru: "Открываю SOS", uz: "SOS ochmoqda", en: "Opening SOS" },
  PREMIUM: { ru: "Открываю Premium", uz: "Premium ochmoqda", en: "Opening Premium" },
  NAVIGATE_HOME: { ru: "Открываю главную", uz: "Bosh sahifa", en: "Opening home" },
  NAVIGATE_AI: { ru: "Открываю AI-чат", uz: "AI chat", en: "Opening AI" },
  NAVIGATE_SCANNER: { ru: "Открываю сканер", uz: "Skaner", en: "Opening scanner" },
  NAVIGATE_JOBS: { ru: "Открываю вакансии", uz: "Vakansiyalar", en: "Opening jobs" },
  NAVIGATE_MAP: { ru: "Открываю карту", uz: "Xarita", en: "Opening map" },
  NAVIGATE_PROFILE: { ru: "Открываю профиль", uz: "Profil", en: "Opening profile" },
  NAVIGATE_TRACKER: { ru: "Открываю календарь", uz: "Patent", en: "Opening calendar" },
  NAVIGATE_SOS: { ru: "Открываю SOS", uz: "SOS", en: "Opening SOS" },
  NAVIGATE_SETTINGS: { ru: "Открываю настройки", uz: "Sozlamalar", en: "Opening settings" },
  NAVIGATE_ADMIN: { ru: "Открываю админ-панель", uz: "Admin panel", en: "Opening admin" },
  NAVIGATE_HISTORY: { ru: "Открываю историю", uz: "Tarix", en: "Opening history" },
  NAVIGATE_PREMIUM: { ru: "Открываю Premium", uz: "Premium", en: "Opening Premium" },
  VOICE_SETTINGS: { ru: "Открываю голосовые настройки", uz: "Ovoz sozlamalari", en: "Opening voice" },
  WEATHER: { ru: "Показываю погоду...", uz: "Ob-havo...", en: "Showing weather..." },
  CALCULATE_90_180: { ru: "Открываю калькулятор", uz: "Kalkulyator", en: "Opening calculator" },
  OPEN_VACANCIES_LIST: { ru: "Открываю вакансии", uz: "Vakansiyalar", en: "Opening jobs" },
};

function fillTemplate(tpl: string, entities: ExtractedEntities, lang: Lang): string {
  const placeName = entities.placeDisplay?.[lang] || entities.textObject || "объект";
  const what = entities.professionDisplay?.[lang] || entities.textObject || placeName;
  const where = entities.city || "";
  const to = entities.routeFromTo?.to || entities.city || "";

  return tpl
    .replace("{what}", what)
    .replace("{where}", where ? (lang === "ru" ? `в ${where}` : lang === "uz" ? `${where}da` : `in ${where}`) : "")
    .replace("{to}", to)
    .replace(/\s+/g, " ")
    .trim();
}

export function buildReply(intent: IntentType, entities: ExtractedEntities, lang: Lang = "ru"): string {
  const tpl = TEMPLATES[intent]?.[lang] || SHORT_REPLIES[intent]?.[lang] || "Обрабатываю...";
  return fillTemplate(tpl, entities, lang);
}