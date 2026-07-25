"use client";

/**
 * Распознавание голосовых команд в намерения.
 * Используется поверх текста, полученного из STT.
 * Поддерживает RU / UZ / EN.
 */

import type { Lang } from "@/i18n";

export type VoiceCommandType =
  | "NAVIGATE_HOME"
  | "NAVIGATE_AI"
  | "NAVIGATE_SCANNER"
  | "NAVIGATE_JOBS"
  | "NAVIGATE_MAP"
  | "NAVIGATE_PROFILE"
  | "NAVIGATE_PREMIUM"
  | "NAVIGATE_TRACKER"
  | "NAVIGATE_SOS"
  | "NAVIGATE_SETTINGS"
  | "NAVIGATE_ADMIN"
  | "TRANSLATE_PHOTO"
  | "FIND_JOBS"
  | "SHOW_MAP"
  | "WEATHER"
  | "CALCULATE_90_180"
  | "SOS"
  | "CHECK_EMPLOYER"
  | "AI_CHAT";

export interface VoiceCommand {
  type: VoiceCommandType;
  /** параметры команды (например, query для карты/вакансий) */
  params: {
    query?: string;
    city?: string;
    profession?: string;
  };
  /** уверенность 0..1 */
  confidence: number;
  /** оригинальный текст, который произнёс пользователь */
  rawText: string;
  /** язык, на котором была команда */
  language: Lang;
}

interface Rule {
  type: VoiceCommandType;
  patterns: string[]; // regex, case-insensitive
  extractQuery?: boolean; // попробовать вытащить параметр из остатка фразы
  extractCity?: boolean;
  extractProfession?: boolean;
  lang: Lang[];
}

const RULES: Rule[] = [
  // ===== Навигация =====
  { type: "NAVIGATE_HOME", lang: ["ru","uz","en"], patterns: [r"\b(главн(ая|ую|ой)|home)\b", r"\b(bosh sahifa|asosiy)\b", r"\b(home|main page)\b"] },
  { type: "NAVIGATE_AI", lang: ["ru","uz","en"], patterns: [r"\b(чат(ом|а|у)?|ai\b|помощник|ассистент)\b", r"\b(chat|ai assistant|assistant)\b", r"\b(chat|yordamchi)\b"] },
  { type: "NAVIGATE_SCANNER", lang: ["ru","uz","en"], patterns: [r"\b(скан(ер|ер)?|ocr|фото перевод)\b", r"\b(skaner|rasm tarjimasi)\b", r"\b(scanner|photo translation)\b"] },
  { type: "NAVIGATE_JOBS", lang: ["ru","uz","en"], patterns: [r"\b(вакансии|вакансий|работ(а|у|ы)?)\b", r"\b(vakansiya|ish)\b", r"\b(jobs|vacancy|work)\b"] },
  { type: "NAVIGATE_MAP", lang: ["ru","uz","en"], patterns: [r"\b(карт(а|у|е|ы)|карты)\b", r"\b(xarita)\b", r"\b(map)\b"] },
  { type: "NAVIGATE_PROFILE", lang: ["ru","uz","en"], patterns: [r"\b(профил(ь|я|ю)|кабинет)\b", r"\b(profil|kabinet)\b", r"\b(profile|cabinet)\b"] },
  { type: "NAVIGATE_PREMIUM", lang: ["ru","uz","en"], patterns: [r"\b(премиум|premium)\b"] },
  { type: "NAVIGATE_TRACKER", lang: ["ru","uz","en"], patterns: [r"\b(патент|календарь патент)\b", r"\b(patent|patent kalendari)\b", r"\b(patent calendar)\b"] },
  { type: "NAVIGATE_SOS", lang: ["ru","uz","en"], patterns: [r"\b(sos\b|экстрен(ная|ый|ую)|помощь срочно)\b", r"\b(sos|shoshilinch yordam)\b", r"\b(sos|emergency)\b"] },
  { type: "NAVIGATE_SETTINGS", lang: ["ru","uz","en"], patterns: [r"\b(настройк(и|у|ам)|установк(и|у))\b", r"\b(sozlamalar)\b", r"\b(settings|setup)\b"] },
  { type: "NAVIGATE_ADMIN", lang: ["ru","uz","en"], patterns: [r"\b(админ(ка|ь)?|панель)\b", r"\b(admin|admin paneli)\b", r"\b(admin|admin panel)\b"] },

  // ===== Действия =====
  { type: "TRANSLATE_PHOTO", lang: ["ru","uz","en"], patterns: [r"\b(переведи|распознай|скан(ируй|ить)?)\b.*\b(фото|картинк|текст|документ)\b", r"\b(tarjima qil|rasm.*tarjima|skannerlash)\b", r"\b(translate|scan)\b.*\b(photo|image|document)\b"] },
  { type: "FIND_JOBS", lang: ["ru","uz","en"], patterns: [r"\b(найди|ищу|поищи)\b.*\b(работ|ваканс)\b", r"\b(top|qidir|izla)\b.*\b(ish|vakansiya)\b", r"\b(find|search|look for)\b.*\b(job|vacanc|work)\b"], extractProfession: true, extractCity: true },
  { type: "SHOW_MAP", lang: ["ru","uz","en"], patterns: [r"\b(покажи|где|открой)\b.*\b(на карте|карт)\b", r"\b(ko'?rsat|qayerda|xaritada)\b", r"\b(show|where|find).*\b(map|on the map)\b"], extractQuery: true },
  { type: "WEATHER", lang: ["ru","uz","en"], patterns: [r"\b(погод(а|у|е|ы)|температур)\b", r"\b(ob-havo|havo)\b", r"\b(weather|temperature)\b"], extractCity: true },
  { type: "CALCULATE_90_180", lang: ["ru","uz","en"], patterns: [r"\b(90\s*/\s*180|90 на 180|90 дней)\b", r"\b(90\s*/\s*180|90 kun)\b", r"\b(90\s*/\s*180)\b"] },
  { type: "SOS", lang: ["ru","uz","en"], patterns: [r"\b(полиц(ия|ею)|проверк(а|у|и)|останов(или|или)\b", r"\b(politsiya|to'xtat)\b", r"\b(police|check|stop)\b"] },
  { type: "CHECK_EMPLOYER", lang: ["ru","uz","en"], patterns: [r"\b(провер(ь|ить|ить))\b.*\b(работодател|компани|фирм)\b", r"\b(tekshir|ish beruvchi|kompaniya)\b", r"\b(check|verify).*\b(employer|company)\b"] },
];

/**
 * Определяет голосовую команду из распознанного текста.
 * Возвращает команду с самой высокой confidence, или null, если ничего не подошло.
 */
export function detectVoiceCommand(text: string, appLang: Lang = "ru"): VoiceCommand | null {
  if (!text || text.trim().length < 2) return null;
  const raw = text.trim();
  const low = raw.toLowerCase();
  const detectedLang = detectLanguageFromText(raw);

  let best: { rule: Rule; score: number } | null = null;

  for (const rule of RULES) {
    if (!rule.lang.includes(detectedLang) && !rule.lang.includes(appLang)) continue;
    for (const pattern of rule.patterns) {
      const re = new RegExp(pattern, "i");
      if (re.test(low)) {
        // Чем больше совпало паттернов — тем выше score
        const matches = rule.patterns.filter((p) => new RegExp(p, "i").test(low)).length;
        const score = matches * 0.4 + (pattern.length / 100);
        if (!best || score > best.score) {
          best = { rule, score };
        }
      }
    }
  }

  if (!best) return null;

  // Извлекаем параметры
  const params: VoiceCommand["params"] = {};
  if (best.rule.extractQuery) {
    const query = extractAfter(raw, ["покажи", "где", "открой", "найди", "ko'rsat", "qayerda", "top", "show", "where"]);
    if (query) params.query = query;
  }
  if (best.rule.extractCity) {
    const city = extractCity(raw);
    if (city) params.city = city;
  }
  if (best.rule.extractProfession) {
    const prof = extractProfession(raw);
    if (prof) params.profession = prof;
  }

  return {
    type: best.rule.type,
    params,
    confidence: Math.min(1, best.score),
    rawText: raw,
    language: detectedLang,
  };
}

function detectLanguageFromText(text: string): Lang {
  if (/[ўғқҳ]/i.test(text)) return "uz";
  if (/\b(salom|rahmat|yordam|qayer|qanday|kerak)\b/i.test(text.toLowerCase())) return "uz";
  if (/[а-яё]/i.test(text) && !/[a-z]/i.test(text)) return "ru";
  if (/[a-z]/i.test(text) && !/[а-яё]/i.test(text)) return "en";
  return "ru";
}

function extractAfter(text: string, keywords: string[]): string {
  const low = text.toLowerCase();
  for (const kw of keywords) {
    const idx = low.indexOf(kw);
    if (idx >= 0) {
      let rest = text.slice(idx + kw.length).replace(/^(на|в|во|к|the|a|an)\s+/i, "").trim();
      // Убираем хвостовые слова вроде "на карте"
      rest = rest.replace(/\b(на карте|on the map|xaritada)\b/gi, "").trim();
      // Убираем вопросительные знаки
      rest = rest.replace(/[?.!]/g, "").trim();
      if (rest && rest.length > 1) return rest;
    }
  }
  return "";
}

function extractCity(text: string): string {
  const cities = [
    "москва", "спб", "санкт-петербург", "казань", "тюмень", "сургут",
    "екатеринбург", "новосибирск", "ташкент", "самарканд", "алматы",
    "бишкек", "душанбе", "моscow", "tashkent", "almaty", "bishkek"
  ];
  const low = text.toLowerCase();
  for (const c of cities) {
    if (low.includes(c)) {
      return c.charAt(0).toUpperCase() + c.slice(1);
    }
  }
  return "";
}

function extractProfession(text: string): string {
  const professions = [
    "сварщик", "водитель", "строитель", "электрик", "разнорабочий",
    "повар", "грузчик", "швея", "продавец", "охранник",
    "welder", "driver", "builder", "electrician", "worker",
    "cook", "seller", "guard", "haydovchi", "chilangar", "quruvchi"
  ];
  const low = text.toLowerCase();
  for (const p of professions) {
    if (low.includes(p)) return p;
  }
  return "";
}

/**
 * Выполняет голосовую команду: возвращает объект с путём навигации или действием.
 * Не выполняет навигацию сам — этим занимается UI-слой.
 */
export interface CommandAction {
  type: "navigate" | "open_url" | "ai_chat" | "weather" | "none";
  path?: string;
  url?: string;
  message?: string;
  params?: Record<string, any>;
}

export function buildCommandAction(cmd: VoiceCommand): CommandAction {
  switch (cmd.type) {
    case "NAVIGATE_HOME": return { type: "navigate", path: "/home", message: "Открываю главную" };
    case "NAVIGATE_AI": return { type: "navigate", path: "/ai", message: "Открываю AI-чат" };
    case "NAVIGATE_SCANNER": return { type: "navigate", path: "/scanner", message: "Открываю сканер" };
    case "NAVIGATE_JOBS": return { type: "navigate", path: "/jobs-test", message: "Открываю вакансии" };
    case "NAVIGATE_MAP": return { type: "navigate", path: "/maps", message: "Открываю карту" };
    case "NAVIGATE_PROFILE": return { type: "navigate", path: "/cabinet", message: "Открываю профиль" };
    case "NAVIGATE_PREMIUM": return { type: "navigate", path: "/premium", message: "Открываю Premium" };
    case "NAVIGATE_TRACKER": return { type: "navigate", path: "/tracker", message: "Открываю календарь патента" };
    case "NAVIGATE_SOS": return { type: "navigate", path: "/sos", message: "Открываю SOS" };
    case "NAVIGATE_SETTINGS": return { type: "navigate", path: "/settings", message: "Открываю настройки" };
    case "NAVIGATE_ADMIN": return { type: "navigate", path: "/admin/login", message: "Открываю админ-панель" };
    case "TRANSLATE_PHOTO": return { type: "navigate", path: "/scanner", message: "Открываю сканер для перевода" };
    case "FIND_JOBS": {
      const params = new URLSearchParams();
      if (cmd.params.profession) params.set("query", cmd.params.profession);
      else if (cmd.params.query) params.set("query", cmd.params.query);
      return { type: "navigate", path: `/jobs-test${params.toString() ? "?" + params.toString() : ""}`, message: "Ищу вакансии" };
    }
    case "SHOW_MAP": {
      const params = new URLSearchParams();
      if (cmd.params.query) params.set("search", cmd.params.query);
      else if (cmd.params.city) params.set("search", cmd.params.city);
      return { type: "navigate", path: `/maps${params.toString() ? "?" + params.toString() : ""}`, message: "Показываю на карте" };
    }
    case "WEATHER": return { type: "weather", message: "Показываю погоду", params: cmd.params };
    case "CALCULATE_90_180": return { type: "navigate", path: "/tracker", message: "Открываю калькулятор 90/180" };
    case "SOS": return { type: "navigate", path: "/sos", message: "Открываю SOS-помощь" };
    case "CHECK_EMPLOYER": return { type: "ai_chat", message: "Проверяю работодателя", params: cmd.params };
    default: return { type: "none" };
  }
}