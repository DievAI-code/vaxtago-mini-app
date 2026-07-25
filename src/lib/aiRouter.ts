"use client";

export type IntentType =
  | "JOB_SEARCH"
  | "MAP_ROUTE"
  | "MAP_SEARCH"
  | "OCR_TRANSLATE"
  | "DOCUMENT_HELP"
  | "LEGAL_HELP"
  | "MIGRATION_HELP"
  | "EMPLOYER_CHECK"
  | "GENERAL_CHAT";

export interface AIIntent {
  type: IntentType;
  confidence: number;
  entities: {
    profession?: string;
    location?: string;
    query?: string;
    from?: string;
    to?: string;
    documentType?: string;
    language?: string;
  };
  originalText: string;
  detectedLanguage: string;
  replyHint?: string;
}

const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  JOB_SEARCH: [
    /ищу работу|найти работу|вакансия|ish qidirish|ish topish|работа|job|vacancy|employment|ishchi kerak/i,
    /сварщик|водитель|разнорабочий|строитель|электрик|программист|manager|driver|welder|operator/i,
  ],
  MAP_ROUTE: [
    /маршрут|как доехать|как добраться|путь|дорога|route|yo'l|yol|навигация|построй маршрут/i,
    /от\s+(.+?)\s+до\s+(.+)/i,
    /как пройти|как проехать/i,
  ],
  MAP_SEARCH: [
    /где находится|найди|покажи на карте|адрес|манзил|address|location|найти место|где это/i,
    /вокзал|аэропорт|больница|метро|станция|магазин|vokzal|aeroport|shifoxona|poliklinika/i,
  ],
  OCR_TRANSLATE: [
    /переведи|распознай|скан|фото|документ|tarjima|scan|translate|ocr|photo|rasm/i,
    /перевести документ|сканировать|фото перевод|hujjatni tarjima qilish/i,
  ],
  DOCUMENT_HELP: [
    /договор|документ|контракт|шартнома|hujjat|contract|document|agreement|akt/i,
  ],
  LEGAL_HELP: [
    /юрист|закон|право|штраф|суд|адвокат|yurist|lawyer|legal|law|court|fine|huquq/i,
  ],
  MIGRATION_HELP: [
    /патент|миграция|мвд|регистрация|виза|patent|migration|migratsiya|vizas|propiska/i,
  ],
  EMPLOYER_CHECK: [
    /проверь работодателя|инн|огрн|компания|работодатель|employer|company|check employer|firma/i,
  ],
  GENERAL_CHAT: [/.*/],
};

function detectLanguage(text: string): string {
  if (/[а-яё]/i.test(text)) return "ru";
  if (/[ўғқҳ]/i.test(text)) return "uz";
  if (/[ҷҳқғ]/i.test(text)) return "tg";
  if (/[ңүө]/i.test(text)) return "ky";
  if (/[a-z]/i.test(text)) return "en";
  return "ru";
}

function getReplyHint(intent: IntentType, lang: string): string {
  const hints: Record<string, Record<string, string>> = {
    ru: {
      JOB_SEARCH: "Ищу подходящие вакансии...",
      MAP_ROUTE: "Строю маршрут...",
      MAP_SEARCH: "Ищу на карте...",
      OCR_TRANSLATE: "Распознаю и перевожу документ...",
      DOCUMENT_HELP: "Анализирую документ...",
      LEGAL_HELP: "Консультирую по правовому вопросу...",
      MIGRATION_HELP: "Подготавливаю миграционную информацию...",
      EMPLOYER_CHECK: "Проверяю работодателя...",
      GENERAL_CHAT: "Думаю над ответом...",
    },
    uz: {
      JOB_SEARCH: "Vakansiyalarni qidirish...",
      MAP_ROUTE: "Yo'nalish tuzish...",
      MAP_SEARCH: "Xaritada qidirish...",
      OCR_TRANSLATE: "Hujjatni tarjima qilish...",
      GENERAL_CHAT: "Javob tayyorlanmoqda...",
    },
    en: {
      JOB_SEARCH: "Searching for jobs...",
      MAP_ROUTE: "Building route...",
      MAP_SEARCH: "Searching map...",
      OCR_TRANSLATE: "Scanning and translating...",
      GENERAL_CHAT: "Thinking...",
    },
  };
  return hints[lang]?.[intent] || hints["ru"][intent] || "Обрабатываю...";
}

export function detectIntent(message: string): AIIntent {
  const detectedLanguage = detectLanguage(message);
  let bestIntent: IntentType = "GENERAL_CHAT";
  let bestConfidence = 0;
  const entities: AIIntent["entities"] = {};

  // Extract profession
  const profMatch = message.match(
    /(сварщик|водитель|разнорабочий|строитель|электрик|программист|manager|driver|welder|operator|ishchi|santexnik|oshpaz)/i
  );
  if (profMatch) entities.profession = profMatch[1];

  // Extract location
  const locMatch = message.match(
    /(москва|ташкент|питер|спб|тюмень|сургут|нижневартовск|тобольск|ишим|самара|уфа|казань|екатеринбург|новосибирск|moskva|tashkent|tyumen|surgut)/i
  );
  if (locMatch) entities.location = locMatch[1];

  // Extract route from/to
  const routeMatch = message.match(/(?:от|с|из)\s+(.+?)\s+(?:до|в|на)\s+(.+)/i);
  if (routeMatch) {
    entities.from = routeMatch[1].trim();
    entities.to = routeMatch[2].trim();
  }

  // Extract generic query after keywords
  const queryClean = message
    .replace(/найди|покажи|где|как|переведи|скан|маршрут|ищу|работа/gi, "")
    .trim();
  if (queryClean) entities.query = queryClean;

  // Score intents
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intent === "GENERAL_CHAT") continue;
    let matches = 0;
    for (const pattern of patterns) {
      if (pattern.test(message)) matches++;
    }
    const confidence = patterns.length > 0 ? matches / patterns.length : 0;
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestIntent = intent as IntentType;
    }
  }

  if (bestConfidence < 0.3) {
    bestIntent = "GENERAL_CHAT";
    bestConfidence = 1;
  }

  return {
    type: bestIntent,
    confidence: bestConfidence,
    entities,
    originalText: message,
    detectedLanguage,
    replyHint: getReplyHint(bestIntent, detectedLanguage),
  };
}