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

export function classifyIntent(message: string): AIIntent {
  const text = message.toLowerCase();

  if (
    text.includes("карта") ||
    text.includes("адрес") ||
    text.includes("найди") ||
    text.includes("где находится") ||
    text.includes("map") ||
    text.includes("kartada") ||
    text.includes("харита") ||
    text.includes("нишон")
  ) {
    return "map";
  }

  if (
    text.includes("переведи") ||
    text.includes("перевод") ||
    text.includes("translate") ||
    text.includes("tarjima") ||
    text.includes("аудар") ||
    text.includes("тарҷума")
  ) {
    return "translate";
  }

  if (
    text.includes("паспорт") ||
    text.includes("документ") ||
    text.includes("виза") ||
    text.includes("регистрация") ||
    text.includes("патент") ||
    text.includes("құжат") ||
    text.includes("hujjat") ||
    text.includes("ҳуҷҷат")
  ) {
    return "document";
  }

  if (
    text.includes("работа") ||
    text.includes("вакансия") ||
    text.includes("вахта") ||
    text.includes("жұмыс") ||
    text.includes("ish") ||
    text.includes("кор") ||
    text.includes("job")
  ) {
    return "jobs";
  }

  return "general";
}

export function detectAIAction(message: string): AIActionResponse {
  const lowerText = message.toLowerCase().trim();
  const lang = detectLanguage(message);

  if (
    lowerText.includes("покажи на карте") ||
    lowerText.includes("найди адрес") ||
    lowerText.includes("где находится") ||
    lowerText.includes("карта") ||
    lowerText.includes("kartada") ||
    lowerText.includes("дар харита") ||
    lowerText.includes("картадан")
  ) {
    return {
      action: "MAP_SEARCH",
      intent: "map",
      query: extractQuery(message),
      message: getLocalizedMessage("map_search", lang),
      success: true,
    };
  }

  if (
    lowerText.includes("построй маршрут") ||
    lowerText.includes("маршрут") ||
    lowerText.includes("как доехать") ||
    lowerText.includes("йўналиш") ||
    lowerText.includes("хатсайр") ||
    lowerText.includes("бағыт")
  ) {
    return {
      action: "BUILD_ROUTE",
      intent: "map",
      query: extractQuery(message),
      message: getLocalizedMessage("build_route", lang),
      success: true,
    };
  }

  if (
    lowerText.includes("переведи") ||
    lowerText.includes("translate") ||
    lowerText.includes("tarjima") ||
    lowerText.includes("аудар") ||
    lowerText.includes("тарҷума")
  ) {
    return {
      action: "TRANSLATE",
      intent: "translate",
      query: message,
      language: lang,
      message: getLocalizedMessage("translate", lang),
      success: true,
    };
  }

  if (
    lowerText.includes("сканируй") ||
    lowerText.includes("скан") ||
    lowerText.includes("документ") ||
    lowerText.includes("құжат") ||
    lowerText.includes("hujjat") ||
    lowerText.includes("ҳуҷҷат")
  ) {
    return {
      action: "DOCUMENT_SCAN",
      intent: "document",
      query: message,
      message: getLocalizedMessage("document_scan", lang),
      success: true,
    };
  }

  if (
    lowerText.includes("ищу работу") ||
    lowerText.includes("вакансии") ||
    lowerText.includes("работа") ||
    lowerText.includes("жұмыс") ||
    lowerText.includes("ish") ||
    lowerText.includes("кор")
  ) {
    return {
      action: "JOB_SEARCH",
      intent: "jobs",
      query: extractQuery(message),
      message: getLocalizedMessage("job_search", lang),
      success: true,
    };
  }

  return {
    action: "GENERAL_CHAT",
    intent: "general",
    query: message,
    message: getLocalizedMessage("general", lang),
    success: true,
  };
}

export function detectIntent(message: string): AIActionResponse {
  return detectAIAction(message);
}

export function detectLanguage(text: string): string {
  if (/[әіңғүұқөһ]/i.test(text)) return "kk";
  if (/[ғқҳҷӯӣ]/i.test(text)) return "tg";
  if (/[ўғқҳ]/i.test(text) || /\bish\b|\bmenga\b|\byordam\b/i.test(text)) return "uz";
  if (/[а-яё]/i.test(text)) return "ru";
  return "ru";
}

function getLocalizedMessage(type: string, lang: string): string {
  const msgs: Record<string, Record<string, string>> = {
    map_search: {
      ru: "Ищу адрес на карте...",
      uz: "Xaritadan manzilni qidiryapman...",
      tg: "Ҷустуҷӯи нишонӣ дар харита...",
      kk: "Картадан мекенжайды іздеудемін...",
    },
    build_route: {
      ru: "Строю маршрут...",
      uz: "Yo'nalish tuzilyapti...",
      tg: "Сохтани хатсайр...",
      kk: "Бағыт салудамын...",
    },
    translate: {
      ru: "Выполняю перевод...",
      uz: "Tarjima qilinmoqda...",
      tg: "Тарҷума шуда истодааст...",
      kk: "Аударма жасаудамын...",
    },
    document_scan: {
      ru: "Открываю сканер...",
      uz: "Skaner ochilmoqda...",
      tg: "Кушодани сканер...",
      kk: "Құжат сканерін ашудамын...",
    },
    job_search: {
      ru: "Ищу вакансии...",
      uz: "Ish o'rinlari qidirilmoqda...",
      tg: "Ҷустуҷӯи кор...",
      kk: "Бос орындарды іздеудемін...",
    },
    general: {
      ru: "Обрабатываю...",
      uz: "Ishlanmoqda...",
      tg: "Коркард...",
      kk: "Өңделуде...",
    },
  };

  return msgs[type]?.[lang] || msgs[type]?.ru || "Processing...";
}

function extractQuery(text: string): string {
  return text.replace(/(?:покажи|найди|где|карта|построй|маршрут|ищу|вакансии|работа|ish|кор|жұмыс)/gi, "").trim() || text;
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