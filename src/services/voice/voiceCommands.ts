"use client";

/**
 * Распознавание голосовых команд в намерения.
 * Используется поверх текста, полученного из STT.
 * Поддерживает RU / UZ / EN.
 *
 * Узбекский язык: поддерживает кириллицу (ў, қ, ғ, ҳ) и латиницу
 * (u, s, h, t, m, q, k, b, o', g', sh, ch, ng).
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
  patterns: string[]; // regex-строки, собираются через new RegExp(p, "i")
  extractQuery?: boolean; // попробовать вытащить параметр из остатка фразы
  extractCity?: boolean;
  extractProfession?: boolean;
  lang: Lang[];
}

// ────────────────────────────────────────────────────────────────────
// Узбекский латинский словарь — срабатывает ДО английского детектора.
// Используется и для language detection, и для нормализации паттернов.
// ────────────────────────────────────────────────────────────────────
const UZBEK_LATIN_TRIGGERS: string[] = [
  // Приветствия и базовые
  "salom", "rahmat", "xayr", "hayrli", "assalomu", "alaykum",
  // Глаголы действия
  "qil", "qilish", "qildim", "qilyapti", "qilaman", "qilsa",
  "ko'rsat", "korsat", "ko'rsa", "korsa",
  "qidir", "qidiryapti", "qidirdim", "qidirmoq", "izla", "izlash", "izlayman",
  "top", "topdim", "topish", "topmoq", "topib", "topamiz",
  "bor", "bormoq", "borish", "bordingiz", "keta", "ketmoq",
  "yubor", "yuborish", "yuboring", "kel", "kelish", "keldi",
  "och", "ochish", "oching", "yop", "yopish",
  "tarjima", "tarjima qil", "tarjimasi", "tarjima qilish",
  "skanerla", "skanerlash", "skaner qil",
  "tekshir", "tekshirish", "tekshirdim",
  // Вопросы и местоимения
  "qayerda", "qayerdan", "qayerga", "qachon", "qanday", "qanaqa",
  "kim", "kimga", "kimgadir", "nima", "nimaga", "nimani",
  // Существительные
  "ish", "ishla", "ishlash", "ishlay", "ishchi", "ishchilar",
  "ish o'rni", "vakansiya", "vakansiyalar", "kasb", "kasbiy",
  "xarita", "xaritadan", "xaritada", "xaritasini", "manzil", "manzili", "manzillar", "manzilni",
  "yo'nalish", "yonalish", "yo'l", "yol", "marshrut",
  "rasm", "rasmlar", "rasmni", "rasmdan", "rasmdagi", "rasmda", "foto", "rasmga",
  "menga", "senga", "unga", "bizga", "sizga",
  "hujjat", "hujjatlar", "hujjatni", "ma'lumot", "malumot", "maqola",
  "kompaniya", "kompaniyalar", "kompaniyani", "firma", "firmalar", "tashkilot", "tashkilotlar",
  "haqida", "uchun", "bilan", "kerak", "kerakmi", "iltimos",
  // Прилагательные
  "yaxshi", "yomon", "katta", "kichik", "qisqa", "uzoq", "yaqin", "uzoqdagi",
  "toshkent", "tashkent", "samarqand", "samarkand", "buxoro", "bukhara",
  "andijon", "andijan", "farg'ona", "fargona", "namangan", "xorazm",
  "qashqadaryo", "jizzax", "jizzakh", "navoiy", "surxondaryo", "termiz",
  // Глагольные формы
  "olib", "olib kel", "olib bor", "chiq", "chiqish", "kir", "kirish",
  "ber", "berish", "berdi", "ol", "olish", "olgan", "olsa",
  // Устойчивые команды
  "yordam", "yordam ber", "yordamchi", "yordam qil",
  "menga yordam", "yordam kerak",
  "ob-havo", "ob havo", "havo", "yomgir", "quyosh",
  "narx", "narxi", "narxini", "qancha", "qanchaga",
  "soat", "vaqt", "vaqti", "kech", "ertalab",
];

// Узбекские города (с вариантами латиницы)
const UZ_CITIES = [
  "toshkent", "tashkent", "toshkentda", "tashkentda",
  "samarqand", "samarkand", "samarqandda", "samarkandda",
  "buxoro", "bukhara", "buxoroda", "bukharada",
  "andijon", "andijan", "andijonda", "andijanda",
  "farg'ona", "fargona", "farg'onada", "fargonada",
  "namangan", "namanganda",
  "xorazm", "urganch", "urganchda",
  "navoiy", "navoiyda", "navoiydan",
  "termiz", "termizda", "termizga",
  "jizzax", "jizzakh", "jizzaxda", "jizzakhda",
  "qarshi", "qarshida", "qarshiga",
  "qo'qon", "qoqon", "qo'qonda", "qoqonda",
  "oltiariq", "asaka", "xovos", "shahrisabz",
  "mo'ynoq", "moynaq",
  "nukus", "nukusda",
  "xiva", "xivada",
  "guliston", "gulistonda",
  "denov", "denovda",
  "nurobod", "nuroboda",
];

// Узбекские профессии (латиница)
const UZ_PROFESSIONS = [
  "chilangar", "chilangi",
  "haydovchi", "haydovchisi",
  "quruvchi", "quruvchilar", "qurilishchi",
  "elektrik", "elektriklar",
  "payvandchi", "payvandlovchi",
  "kranchi", "kran operatori",
  "santexnik", "santexniklar",
  "bo'yoqchi", "boyoqchi",
  "g'isht teruvchi", "gisht teruvchi", "g'ishtchi",
  "malyakchi", "malyak", "malyar",
  "o'qituvchi", "oqituvchi", "o'qituvchilar",
  "shifokor", "hamshira", "tibbiyot",
  "sotuvchi", "sotuvchilar", "kassir",
  "tarjimon", "tarjimoni",
  "kontroller", "nazoratchi",
  "tikuvchi", "tikuvchilar", "tikuv ayol",
  "oshpaz", "oshpazlar", "pishloqchi",
  "fermer", "fermerlar", "dehqon",
  "kutubxonachi", "kutubxonachilar",
  "taksi haydovchi", "taksist",
  "ekskavatorchi", "traktorchi",
  "mexanik", "mexaniklar",
  "shofyor", "shofyorlar",
  "gvardiyachi", "qoravul",
  "buxgalter", "buxgalterlar", "hisobchi",
  "muhandis", "muhandislar",
  "meneger", "menejer", "manager",
  "ishchi", "ishchilar",
];

const RULES: Rule[] = [
  // ===== Навигация =====
  { type: "NAVIGATE_HOME", lang: ["ru","uz","en"], patterns: [
    "\\b(главн(ая|ую|ой)|home)\\b",
    "\\b(bosh sahifa|asosiy|asosiy sahifa|boshqa sahifa)\\b",
    "\\b(home|main page|homepage)\\b",
  ] },
  { type: "NAVIGATE_AI", lang: ["ru","uz","en"], patterns: [
    "\\b(чат(ом|а|у)?|ai\\b|помощник|ассистент|бот)\\b",
    "\\b(chat|ai assistant|assistant)\\b",
    "\\b(chat|yordamchi|assistent|bot)\\b",
  ] },
  { type: "NAVIGATE_SCANNER", lang: ["ru","uz","en"], patterns: [
    "\\b(скан(ер|ер)?|ocr|фото перевод|распозна(й|ть))\\b",
    "\\b(skaner|rasm tarjimasi|skannerlash|rasmni tarjima qil)\\b",
    "\\b(scanner|photo translation|photo translate|scan)\\b",
  ] },
  { type: "NAVIGATE_JOBS", lang: ["ru","uz","en"], patterns: [
    "\\b(вакансии|вакансий|работ(а|у|ы|е)?|устрои(ться|ться))\\b",
    "\\b(vakansiya|vakansiyalar|ish|ishla|ish o['’]?rni|ishlab|ishchi|kasb)\\b",
    "\\b(jobs|vacancy|vacancies|work|job)\\b",
  ] },
  { type: "NAVIGATE_MAP", lang: ["ru","uz","en"], patterns: [
    "\\b(карт(а|у|е|ы)|карты|гео|где наход(ится|ятся))\\b",
    "\\b(xarita|xaritada|xaritani|manzil|manzilni|manzili|yo['’]?nalish|yo['’]?l|yol|marshrut|qayerda|ko['’]?rsat|korsat)\\b",
    "\\b(map|where|location|directions|route|navigate)\\b",
  ] },
  { type: "NAVIGATE_PROFILE", lang: ["ru","uz","en"], patterns: [
    "\\b(профил(ь|я|ю)|кабинет|аккаунт|личн(ый|ая))\\b",
    "\\b(profil|kabinet|akkaunt|shaxsiy)\\b",
    "\\b(profile|cabinet|account|my)\\b",
  ] },
  { type: "NAVIGATE_PREMIUM", lang: ["ru","uz","en"], patterns: [
    "\\b(премиум|premium|подписк(а|у|и))\\b",
    "\\b(premium|obuna|obuna bo['’]?lish)\\b",
    "\\b(premium|subscription)\\b",
  ] },
  { type: "NAVIGATE_TRACKER", lang: ["ru","uz","en"], patterns: [
    "\\b(патент|календарь патент)\\b",
    "\\b(patent|patent kalendari|patent muddati)\\b",
    "\\b(patent calendar|patent)\\b",
  ] },
  { type: "NAVIGATE_SOS", lang: ["ru","uz","en"], patterns: [
    "\\b(sos\\b|экстрен(ная|ый|ую)|помощь срочно|чп)\\b",
    "\\b(sos|shoshilinch yordam|shoshilinch|tezkor yordam|falokat)\\b",
    "\\b(sos|emergency|help me|urgent)\\b",
  ] },
  { type: "NAVIGATE_SETTINGS", lang: ["ru","uz","en"], patterns: [
    "\\b(настройк(и|у|ам)|установк(и|у)|параметр(ы|ов))\\b",
    "\\b(sozlamalar|sozlama|tanlovlar)\\b",
    "\\b(settings|setup|preferences|options)\\b",
  ] },
  { type: "NAVIGATE_ADMIN", lang: ["ru","uz","en"], patterns: [
    "\\b(админ(ка|ь)?|панель админа|администратор)\\b",
    "\\b(admin|admin paneli|administrator)\\b",
    "\\b(admin|admin panel|administrator)\\b",
  ] },

  // ===== Действия =====
  { type: "TRANSLATE_PHOTO", lang: ["ru","uz","en"], patterns: [
    "\\b(переведи|распознай|скан(ируй|ить)?|фото перевод|текст на фото)\\b",
    "\\b(tarjima qil|rasmni tarjima qil|rasmdagi matn|rasm tarjima|skanerla|skaner qil|matn tarjima|foto tarjima)\\b",
    "\\b(translate|scan|read text|photo translate|image translation)\\b",
  ] },
  { type: "FIND_JOBS", lang: ["ru","uz","en"], patterns: [
    "\\b(найди|ищу|поищи|покажи).{0,30}\\b(работ|ваканс)\\b",
    "\\b(ish top|ish qidir|ish kerak|qidir|topib ber|izla|izlash|ishlab)\\b",
    "\\b(find|search|look for).{0,30}\\b(job|vacanc|work|position)\\b",
  ], extractProfession: true, extractCity: true },
  { type: "SHOW_MAP", lang: ["ru","uz","en"], patterns: [
    "\\b(покажи|где|открой).{0,30}\\b(на карте|карте|карт)\\b",
    "\\b(ko['’]?rsat|qayerda|xaritada|manzilni top|topib ko['’]?rsat|qayerdaligini)\\b",
    "\\b(show|where|find).{0,30}\\b(map|on the map|address)\\b",
  ], extractQuery: true },
  { type: "WEATHER", lang: ["ru","uz","en"], patterns: [
    "\\b(погод(а|у|е|ы)|температур(а|у|ы)|какая погода)\\b",
    "\\b(ob-havo|ob havo|havo|harorat)\\b",
    "\\b(weather|temperature)\\b",
  ], extractCity: true },
  { type: "CALCULATE_90_180", lang: ["ru","uz","en"], patterns: [
    "\\b(90\\s*/\\s*180|90 на 180|90 дней|180 дней)\\b",
    "\\b(90\\s*/\\s*180|90 kun|180 kun)\\b",
    "\\b(90\\s*/\\s*180|90 days|180 days)\\b",
  ] },
  { type: "SOS", lang: ["ru","uz","en"], patterns: [
    "\\b(полиц(ия|ею)|проверк(а|у|и)|останов(или|или)|задержа(ли|ть))\\b",
    "\\b(politsiya|to['’]?xat|to['’]?xtatib qol|tekshirish)\\b",
    "\\b(police|check|stop|detained|arrested)\\b",
  ] },
  { type: "CHECK_EMPLOYER", lang: ["ru","uz","en"], patterns: [
    "\\b(провер(ь|ить|ить)).{0,30}\\b(работодател|компани|фирм|предприят)\\b",
    "\\b(tekshir|ish beruvchi|kompaniya|firma|tashkilot)\\b",
    "\\b(check|verify).{0,30}\\b(employer|company|firm)\\b",
  ] },
];

// ────────────────────────────────────────────────────────────────────
// Детекция узбекского латинского текста по триггерам.
// Вызывается ДО проверки "только латиница", чтобы не путать с EN.
// ────────────────────────────────────────────────────────────────────
function hasUzbekLatinTriggers(lowText: string): boolean {
  // 1) Точное вхождение триггера (с учётом границ слова)
  for (const trig of UZBEK_LATIN_TRIGGERS) {
    const re = new RegExp(`\\b${escapeRegex(trig)}\\b`, "i");
    if (re.test(lowText)) return true;
  }
  return false;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
    const query = extractAfter(raw, [
      "покажи", "где", "открой", "найди", "ko'rsat", "korsat", "qayerda", "top", "show", "where",
    ]);
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

/**
 * Детекция языка текста. Узбекский в латинице проверяется ПЕРЕД английским.
 * Узбекский в кириллице определяется по специфическим буквам (ў, қ, ғ, ҳ).
 */
function detectLanguageFromText(text: string): Lang {
  // 1) Узбекская кириллица: специфические буквы
  if (/[ўғқҳ]/i.test(text)) return "uz";

  const low = text.toLowerCase();

  // 2) Узбекская латиница — проверяем по триггерам ПЕРЕД английской
  if (hasUzbekLatinTriggers(low)) return "uz";

  // 3) Узбекская латиница — лояльный fallback: если текст
  //    содержит несколько специфических латинских окончаний
  const uzbekSuffixes = /\b(lar|larim|lariga|larida|lardan|ning|ni|ga|da|dan|cha|qilish|tushun|kerak|bolgan|edim|edi|miz|moq|ishlash|ishlay|yashay|yashash)\b/i;
  if (uzbekSuffixes.test(low) && /[a-z]/i.test(text)) {
    // Если в тексте присутствуют узбекские морфемы — скорее всего это UZ
    const matches = low.match(uzbekSuffixes);
    if (matches && matches.length >= 1) return "uz";
  }

  // 4) Чистая кириллица — RU
  if (/[а-яё]/i.test(text) && !/[a-z]/i.test(text)) return "ru";

  // 5) Чистая латиница — EN
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
      rest = rest.replace(/\b(на карте|on the map|xaritada|manzili)\b/gi, "").trim();
      // Убираем вопросительные знаки
      rest = rest.replace(/[?.!]/g, "").trim();
      if (rest && rest.length > 1) return rest;
    }
  }
  return "";
}

/**
 * Извлекает город из распознанного текста. Поддерживает RU / UZ (cyr+lat) / EN.
 */
function extractCity(text: string): string {
  // Универсальный список городов
  const cities = [
    // RU
    "москва", "спб", "санкт-петербург", "казань", "тюмень", "сургут",
    "екатеринбург", "новосибирск", "краснодар", "сочи",
    // UZ
    ...UZ_CITIES,
    // EN
    "moscow", "saint petersburg", "st petersburg",
    "tashkent", "samarkand", "bukhara", "andijan",
  ];

  const low = text.toLowerCase();
  for (const c of cities) {
    if (low.includes(c)) {
      // Capitalize первое слово
      return c
        .split(/(\s|-)/)
        .map((part, i) => (i % 2 === 0 && part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join("");
    }
  }
  return "";
}

/**
 * Извлекает профессию из текста. Поддерживает RU / UZ (cyr+lat) / EN.
 */
function extractProfession(text: string): string {
  const professions = [
    // RU
    "сварщик", "водитель", "строитель", "электрик", "разнорабочий",
    "повар", "грузчик", "швея", "продавец", "охранник", "маляр", "штукатур",
    // UZ (латиница)
    ...UZ_PROFESSIONS,
    // UZ (кириллица)
    "пайвандчи", "хайдовчи", "курувчи", "электрик", "сантехник",
    "бўёқчи", "уста", "молла",
    // EN
    "welder", "driver", "builder", "electrician", "worker",
    "cook", "seller", "guard", "manager",
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