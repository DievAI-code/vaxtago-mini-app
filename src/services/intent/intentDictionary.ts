/**
 * Intent-словарь: правила распознавания намерений.
 * Один источник истины для всех intents системы.
 *
 * Каждое правило содержит:
 *  - intent: тип намерения
 *  - patterns: regex-строки (RU/UZ/EN)
 *  - baseWeight: приоритет правила
 *  - extract* — флаги для entityExtractor
 */

import type { Lang } from "@/i18n";

export type IntentType =
  | "MAP_SEARCH"
  | "MAP_ROUTE"
  | "JOB_SEARCH"
  | "OCR_TRANSLATE"
  | "DOCUMENT_CHECK"
  | "EMPLOYER_CHECK"
  | "AI_CHAT"
  | "SOS"
  | "PREMIUM"
  | "VOICE_SETTINGS"
  | "NAVIGATE_HOME"
  | "NAVIGATE_AI"
  | "NAVIGATE_SCANNER"
  | "NAVIGATE_JOBS"
  | "NAVIGATE_MAP"
  | "NAVIGATE_PROFILE"
  | "NAVIGATE_TRACKER"
  | "NAVIGATE_SOS"
  | "NAVIGATE_SETTINGS"
  | "NAVIGATE_ADMIN"
  | "NAVIGATE_HISTORY"
  | "NAVIGATE_PREMIUM"
  | "OPEN_VACANCIES_LIST"
  | "WEATHER"
  | "CALCULATE_90_180";

export interface IntentRule {
  intent: IntentType;
  patterns: string[];
  baseWeight: number;
  lang: Lang[];
  extractCity?: boolean;
  extractProfession?: boolean;
  extractPlace?: boolean;
  extractOrg?: boolean;
  extractRouteFromTo?: boolean;
  extractTextObject?: boolean;
  extractDocumentType?: boolean;
}

export const INTENT_RULES: IntentRule[] = [
  // ─── MAP_SEARCH (поиск объекта на карте) ───
  {
    intent: "MAP_SEARCH",
    patterns: [
      // RU
      "\\b(найди|найти|поищи|где есть|где находится|покажи|ko'rsat)\\b.*\\b(на карте|map|karta|xarita)\\b",
      "\\b(где|куда)\\s+(найти|искать|есть|искать)\\b",
      "\\b(ближайший|ближайшая|рядом|недалеко|поблизости|eng yaqin)\\b",
      "\\b(найди мне|покажи мне|где мне найти)\\b",
      // UZ
      "\\b(xaritada ko'rsat|haritada ko'rsat)\\b",
      "\\b(qayerda|qayerdaligini)\\b",
      "\\b(eng yaqin|yaqin)\\b",
      "\\b(topib ber|topib ko'rsat)\\b",
      "\\b(manzil|manzilni)\\s+(top|korsat|ko'rsat)\\b",
      // EN
      "\\b(show|find|where is|locate|nearest|close to)\\b",
      "\\b(on the map|on map|near me|nearby)\\b",
    ],
    baseWeight: 0.7,
    lang: ["ru", "uz", "en"],
    extractCity: true,
    extractPlace: true,
    extractOrg: true,
    extractTextObject: true,
  },

  // ─── MAP_ROUTE (построить маршрут) ───
  {
    intent: "MAP_ROUTE",
    patterns: [
      // RU
      "\\b(маршрут|как доехать|как добраться|как пройти|как проехать|построй маршрут|построить маршрут|проложи маршрут)\\b",
      "\\b(доехать до|добраться до|дойти до|проехать до)\\b",
      "\\b(от|из|с)\\s+.{2,}\\s+(до|в|на)\\s+",
      // UZ
      "\\b(marshrut|qanday borish|qanday yetib borish|qanday boraman|yo'l ko'rsat)\\b",
      "\\b(.{2,}\\s+dan\\s+.{2,}\\s+ga)\\b",
      // EN
      "\\b(route|directions|navigate|how to get|how do i get)\\b",
      "\\b(from\\s+.{2,}\\s+to\\s+)\\b",
    ],
    baseWeight: 0.85,
    lang: ["ru", "uz", "en"],
    extractCity: true,
    extractPlace: true,
    extractOrg: true,
    extractRouteFromTo: true,
  },

  // ─── JOB_SEARCH (поиск вакансий) ───
  {
    intent: "JOB_SEARCH",
    patterns: [
      // RU
      "\\b(найди работу|ищу работу|поищи работу|есть работа|нужна работа|есть вакансия|есть вакансии)\\b",
      "\\b(вакансия|вакансии|вакансию|работа|работу|работы|трудоустройство)\\b",
      "\\b(свежие вакансии|высокооплачиваемая работа|работа без опыта)\\b",
      "\\b(вахта|вахтой|вахтовая работа)\\b",
      "\\b(работа с проживанием|работа с жильем|работа с питанием)\\b",
      "\\b(работа сегодня|работа рядом)\\b",
      "\\b(нужны работники|требуются)\\b",
      // UZ
      "\\b(ish top|ish qidir|ish kerak|vakansiya qidir|vakansiya top)\\b",
      "\\b(ish o'rni|ishla|ishlab|vakansiya|vakansiyalar)\\b",
      "\\b(hozir ish|bugun ish)\\b",
      "\\b(yashash bilan|yashash joyi bilan)\\b",
      "\\b(topib ber|qidirib ber|izlab top)\\b",
      // EN
      "\\b(find job|search job|search jobs|find work|find a job)\\b",
      "\\b(jobs|vacancies|vacancy|hire me)\\b",
      "\\b(shift work|seasonal work)\\b",
    ],
    baseWeight: 0.85,
    lang: ["ru", "uz", "en"],
    extractCity: true,
    extractProfession: true,
    extractOrg: true,
  },

  // ─── OCR_TRANSLATE (распознать + перевести) ───
  {
    intent: "OCR_TRANSLATE",
    patterns: [
      // RU
      "\\b(переведи|распознай|скан(ируй|ить)?|прочитай|отсканируй)\\b.*\\b(фото|фотограф|картинк|изображен|документ|текст|бумаг|скан)\\b",
      "\\b(фото|фотограф|картинк|документ|скан)\\b.*\\b(переведи|распознай|скан(ируй|ить)?|прочитай|отсканируй)\\b",
      "\\b(переведи|распознай|скан)\\b",
      "\\b(фото перевод|документ перевод|скан документа|скан фото)\\b",
      "\\b(ocr|распознавание текста)\\b",
      "\\b(перевести паспорт|перевести договор|перевести миграционную карту|перевести патент|перевести справку)\\b",
      // UZ
      "\\b(tarjima qil|rasmni tarjima|hujjatni tarjima|matnni tarjima|foto tarjima)\\b",
      "\\b(rasm|hujjat|matn|foto)\\s+(tarjima|o'qib ber|skanerla)\\b",
      "\\b(skanerla|skanerlash|skaner qil|rasmni o'qib ber|hujjatni o'qib ber|matnni o'qib ber)\\b",
      // EN
      "\\b(translate|scan|read|ocr)\\b.*\\b(photo|document|image|text|picture)\\b",
      "\\b(photo|document|image|text|picture)\\b.*\\b(translate|scan|read|ocr)\\b",
    ],
    baseWeight: 0.8,
    lang: ["ru", "uz", "en"],
    extractDocumentType: true,
    extractTextObject: true,
  },

  // ─── DOCUMENT_CHECK (проверка документов) ───
  {
    intent: "DOCUMENT_CHECK",
    patterns: [
      // RU
      "\\b(проверить|узнать|когда|как)\\b.*\\b(патент|регистрац|миграционн|паспорт|документ)\\b",
      "\\b(когда заканчивается регистрация|когда платить патент|когда заканчивается патент)\\b",
      "\\b(продлить регистрацию|продлить патент|оформить патент|оформить регистрацию)\\b",
      "\\b(миграционный учёт|миграционный учет|миграционный календарь)\\b",
      "\\b(срок действия патента|срок действия регистрации|действие патента|действие регистрации)\\b",
      // UZ
      "\\b(tekshir|tekshirmoq|qachon tugaydi)\\b.*\\b(patent|registratsiya|migratsion|pasport|hujjat)\\b",
      "\\b(patent|registratsiya)\\s+(qachon|uzaytirish)\\b",
      // EN
      "\\b(check|verify|expiry|when)\\b.*\\b(patent|registration|passport|document|visa)\\b",
      "\\b(extend|renew)\\b.*\\b(patent|registration|passport|document)\\b",
    ],
    baseWeight: 0.7,
    lang: ["ru", "uz", "en"],
    extractDocumentType: true,
  },

  // ─── EMPLOYER_CHECK (проверка работодателя) ───
  {
    intent: "EMPLOYER_CHECK",
    patterns: [
      // RU
      "\\b(провер(ь|ить|ить)?)\\b.*\\b(работодател|компани|фирм|организац|предприят)\\b",
      "\\b(это мошенники|мошенник|мошенничество|можно доверять|не мошенники|надёжный|надёжная|надёжного|надёжную)\\b",
      "\\b(отзывы о компании|отзывы о работодателе|отзыв о компании)\\b",
      "\\b(безопасно ли работать|стоит ли работать)\\b",
      // UZ
      "\\b(tekshir|ishonch)\\b.*\\b(ish beruvchi|kompaniya|firma|tashkilot)\\b",
      "\\b(aldovchi|aldovchilar|firibgar|firibgarlar)\\b",
      // EN
      "\\b(check|verify|trust|scam|fraud)\\b.*\\b(employer|company|firm)\\b",
      "\\b(is it safe|is this company legit|reliable)\\b",
    ],
    baseWeight: 0.75,
    lang: ["ru", "uz", "en"],
    extractOrg: true,
  },

  // ─── AI_CHAT (общий вопрос) ───
  {
    intent: "AI_CHAT",
    patterns: [
      // RU
      "\\b(объясни|объясните|расскажи|расскажите|подскажи|подскажите)\\b",
      "\\b(что делать|что мне делать|как быть|как мне быть)\\b",
      "\\b(что означает|что значит|что это)\\b",
      "\\b(как оформить|как получить|как перевести|как найти|как добраться|как сделать|как оплатить)\\b",
      "\\b(что лучше|что выгоднее|что дешевле|что дороже)\\b",
      "\\b(можешь ли ты|ты можешь|что ты умеешь)\\b",
      // UZ
      "\\b(tushuntir|tushuntirib ber|aytib ber|ayt|maslahat ber)\\b",
      "\\b(nima qilish|nima qilaman|qanday qilish)\\b",
      "\\b(nima degani|bu nima)\\b",
      "\\b(qanday rasmiylashtirish|qanday olish|qanday tarjima|qanday topish|qanday borish)\\b",
      // EN
      "\\b(explain|tell me|what is|how to|how do i)\\b",
      "\\b(can you|do you)\\b",
      "\\b(what should i|what to do)\\b",
    ],
    baseWeight: 0.4,
    lang: ["ru", "uz", "en"],
    extractCity: true,
    extractOrg: true,
    extractTextObject: true,
  },

  // ─── SOS (экстренная помощь) ───
  {
    intent: "SOS",
    patterns: [
      // RU
      "\\b(sos\\b|экстрен(ная|ый|ую|ые)|срочная помощь|экстренная помощь|чп)\\b",
      "\\b(полиц(ия|ии|ию|ей)|полицейский|полицейские|останов(или|или|или|ила)|задержа(ли|ли|ть))\\b",
      "\\b(украли|потерял|потеряла|потерял паспорт|потерял документы|украли документы)\\b",
      "\\b(нужен адвокат|нужна помощь юриста|нужна юридическая помощь|нужен юрист)\\b",
      // UZ
      "\\b(sos\\b|shoshilinch yordam|shoshilinch|falokat)\\b",
      "\\b(politsiya|to'xtatib qol|qamoq|qamoqqa|o'g'irladi|yo'qotdi)\\b",
      "\\b(yurist kerak|yordam kerak)\\b",
      // EN
      "\\b(sos\\b|emergency|help me|urgent|police|arrested|detained)\\b",
      "\\b(stolen|lost passport|lost documents|lawyer)\\b",
    ],
    baseWeight: 0.9,
    lang: ["ru", "uz", "en"],
  },

  // ─── PREMIUM ───
  {
    intent: "PREMIUM",
    patterns: [
      "\\b(премиум|premium|подписк(а|у|и|у)|оформить подписку|оформить premium|купить премиум|купить premium|подключить premium|подключить премиум)\\b",
      "\\b(obuna|obuna bo'lish|obuna olish)\\b",
    ],
    baseWeight: 0.85,
    lang: ["ru", "uz", "en"],
  },

  // ─── Навигация по разделам ───
  {
    intent: "NAVIGATE_HOME",
    patterns: ["\\b(главн(ая|ую|ой)|на главную|home|bosh sahifa|asosiy)\\b"],
    baseWeight: 0.5,
    lang: ["ru", "uz", "en"],
  },
  {
    intent: "NAVIGATE_AI",
    patterns: ["\\b(чат(ом|а|у)?|ai\\b|помощник|ассистент|чат с ai|chat|yordamchi|assistent)\\b"],
    baseWeight: 0.5,
    lang: ["ru", "uz", "en"],
  },
  {
    intent: "NAVIGATE_SCANNER",
    patterns: ["\\b(скан(ер|ер)?|ocr|сканер|сканер документов|сканер фото|scanner|skaner)\\b"],
    baseWeight: 0.5,
    lang: ["ru", "uz", "en"],
  },
  {
    intent: "NAVIGATE_JOBS",
    patterns: ["\\b(вакансии|вакансий|вакансия|работ(а|у|ы|е)?|устрои(ться|ться)|раздел работ)\\b", "\\b(vakansiya|vakansiyalar|ish|bo'lim ish)\\b"],
    baseWeight: 0.4,
    lang: ["ru", "uz", "en"],
  },
  {
    intent: "NAVIGATE_MAP",
    patterns: ["\\b(карт(а|у|е|ы)|открой карту|покажи карту|map|karta|xarita)\\b"],
    baseWeight: 0.5,
    lang: ["ru", "uz", "en"],
  },
  {
    intent: "NAVIGATE_PROFILE",
    patterns: ["\\b(профил(ь|я|ю)|кабинет|аккаунт|личн(ый|ая)|profil|kabinet)\\b"],
    baseWeight: 0.5,
    lang: ["ru", "uz", "en"],
  },
  {
    intent: "NAVIGATE_TRACKER",
    patterns: ["\\b(патент|календарь патент|patent|patent kalendari)\\b"],
    baseWeight: 0.7,
    lang: ["ru", "uz", "en"],
  },
  {
    intent: "NAVIGATE_SOS",
    patterns: ["\\b(sos|экстрен(ная|ый|ую)|помощь срочно|чп)\\b"],
    baseWeight: 0.7,
    lang: ["ru", "uz", "en"],
  },
  {
    intent: "NAVIGATE_SETTINGS",
    patterns: ["\\b(настройк(и|у|ам)|установк(и|у)|параметр(ы|ов)|sozlamalar)\\b"],
    baseWeight: 0.5,
    lang: ["ru", "uz", "en"],
  },
  {
    intent: "NAVIGATE_HISTORY",
    patterns: ["\\b(истори(я|ю)|tarix|тарих)\\b"],
    baseWeight: 0.5,
    lang: ["ru", "uz", "en"],
  },
  {
    intent: "NAVIGATE_PREMIUM",
    patterns: ["\\b(премиум|premium|подписк(а|у|и))\\b"],
    baseWeight: 0.5,
    lang: ["ru", "uz", "en"],
  },
  {
    intent: "NAVIGATE_ADMIN",
    patterns: ["\\b(админ(ка|ь)?|панель админа|администратор|admin)\\b"],
    baseWeight: 0.5,
    lang: ["ru", "uz", "en"],
  },
  {
    intent: "VOICE_SETTINGS",
    patterns: ["\\b(голосов(ые|ой|ые)|голосовые настройки|голосовой помощник|voice|ovoz)\\b"],
    baseWeight: 0.6,
    lang: ["ru", "uz", "en"],
  },

  // ─── Weather / Погода ───
  {
    intent: "WEATHER",
    patterns: ["\\b(погод(а|у|е|ы)|температур(а|у|ы)|какая погода|ob-havo|ob havo|havo|harorat|weather|temperature)\\b"],
    baseWeight: 0.6,
    lang: ["ru", "uz", "en"],
    extractCity: true,
  },

  // ─── Calculator 90/180 ───
  {
    intent: "CALCULATE_90_180",
    patterns: ["\\b(90\\s*/\\s*180|90 на 180|90 дней|180 дней|90\\s*/\\s*180|90 kun|180 kun|90\\s*/\\s*180|90 days|180 days)\\b"],
    baseWeight: 0.85,
    lang: ["ru", "uz", "en"],
  },
];