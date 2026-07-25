"use client";

/**
 * Распознавание голосовых команд в намерения.
 * Используется поверх текста, полученного из STT.
 * Поддерживает RU / UZ / EN.
 *
 * Архитектура:
 *  - Паттерны хранятся как строки (string[]) и компилируются ОДИН раз в Map.
 *  - Синонимы (karta/xarita/harita, vakansiya/vacancy) нормализуются до канона
 *    в normalizeInput() — STT-варианты "vakansia", "harita" теперь матчатся.
 *  - Confidence: взвешенный скор (язык, совпадения, извлечённые сущности, длина).
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
  params: {
    query?: string;
    city?: string;
    profession?: string;
  };
  confidence: number;
  rawText: string;
  language: Lang;
}

interface Rule {
  type: VoiceCommandType;
  patterns: string[];
  extractQuery?: boolean;
  extractCity?: boolean;
  extractProfession?: boolean;
  lang: Lang[];
  baseWeight?: number; // базовый приоритет правила
}

// ────────────────────────────────────────────────────────────────────
// Узбекский латинский словарь — срабатывает ДО английского детектора.
// ────────────────────────────────────────────────────────────────────
const UZBEK_LATIN_TRIGGERS: string[] = [
  "salom", "rahmat", "xayr", "hayrli", "assalomu", "alaykum",
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
  "qayerda", "qayerdan", "qayerga", "qachon", "qanday", "qanaqa",
  "kim", "kimga", "kimgadir", "nima", "nimaga", "nimani",
  "ish", "ishla", "ishlash", "ishlay", "ishchi", "ishchilar",
  "ish o'rni", "vakansiya", "vakansiyalar", "kasb", "kasbiy",
  "xarita", "xaritadan", "xaritada", "xaritasini", "manzil", "manzili", "manzillar", "manzilni",
  "yo'nalish", "yonalish", "yo'l", "yol", "marshrut",
  "rasm", "rasmlar", "rasmni", "rasmdan", "rasmdagi", "rasmda", "foto", "rasmga",
  "menga", "senga", "unga", "bizga", "sizga",
  "hujjat", "hujjatlar", "hujjatni", "ma'lumot", "malumot", "maqola",
  "kompaniya", "kompaniyalar", "kompaniyani", "firma", "firmalar", "tashkilot", "tashkilotlar",
  "haqida", "uchun", "bilan", "kerak", "kerakmi", "iltimos",
  "yaxshi", "yomon", "katta", "kichik", "qisqa", "uzoq", "yaqin", "uzoqdagi",
  "toshkent", "tashkent", "samarqand", "samarkand", "buxoro", "bukhara",
  "andijon", "andijan", "farg'ona", "fargona", "namangan", "xorazm",
  "qashqadaryo", "jizzax", "jizzakh", "navoiy", "surxondaryo", "termiz",
  "olib", "olib kel", "olib bor", "chiq", "chiqish", "kir", "kirish",
  "ber", "berish", "berdi", "ol", "olish", "olgan", "olsa",
  "yordam", "yordam ber", "yordamchi", "yordam qil",
  "menga yordam", "yordam kerak",
  "ob-havo", "ob havo", "havo", "yomgir", "quyosh",
  "narx", "narxi", "narxini", "qancha", "qanchaga",
  "soat", "vaqt", "vaqti", "kech", "ertalab",
  "eng yaqin", "eng yaqini", "yaqin", "eng",
];

// Узбекские города (с вариантами латиницы и суффиксов)
const UZ_CITIES = [
  "toshkent", "tashkent", "toshkentda", "tashkentda", "toshkentga", "tashkentga", "toshkentdan", "tashkentdan", "toshkentni", "tashkentni",
  "samarqand", "samarkand", "samarqandda", "samarkandda", "samarqandga", "samarkandga", "samarqanddan", "samarkanddan", "samarqandni", "samarkandni",
  "buxoro", "bukhara", "buxoroda", "bukharada", "buxoroga", "bukharaga", "buxorodan", "bukharadan", "buxoroni", "bukharani",
  "andijon", "andijan", "andijonda", "andijanda", "andijonga", "andijanga", "andijondan", "andijandan", "andijonni", "andijanni",
  "farg'ona", "fargona", "farg'onada", "fargonada", "farg'onaga", "fargonaga", "farg'onadan", "fargonadan", "farg'onani", "fargonani",
  "namangan", "namanganda", "namanganga", "namangandan", "namanganni",
  "xorazm", "urganch", "urganchda", "urganchga", "urganchdan", "urganchni",
  "navoiy", "navoiyda", "navoiyga", "navoiydan", "navoiyni",
  "termiz", "termizda", "termizga", "termizdan", "termizni",
  "jizzax", "jizzakh", "jizzaxda", "jizzaxga", "jizzaxdan", "jizzaxni",
  "qarshi", "qarshida", "qarshiga", "qarshidan", "qarshini",
  "qo'qon", "qoqon", "qo'qonda", "qoqonda", "qo'qonga", "qoqonga", "qo'qondan", "qoqondan", "qo'qonni", "qoqonni",
  "nukus", "nukusda", "nukusga", "nukusdan", "nukusni",
  "xiva", "xivada", "xivaga", "xivadan", "xivani",
  "guliston", "gulistonda", "gulistonga", "gulistondan", "gulistonni",
  "denov", "denovda", "denovga", "denovdan", "denovni",
];

const UZ_CITY_NORMALIZE: Record<string, string> = {
  toshkent: "Toshkent", tashkent: "Toshkent",
  toshkentda: "Toshkent", tashkentda: "Toshkent",
  toshkentga: "Toshkent", tashkentga: "Toshkent",
  toshkentdan: "Toshkent", tashkentdan: "Toshkent",
  toshkentni: "Toshkent", tashkentni: "Toshkent",
  samarqand: "Samarqand", samarkand: "Samarqand",
  samarqandda: "Samarqand", samarkandda: "Samarqand",
  samarqandga: "Samarqand", samarkandga: "Samarqand",
  samarqanddan: "Samarqand", samarkanddan: "Samarqand",
  samarqandni: "Samarqand", samarkandni: "Samarqand",
  buxoro: "Buxoro", bukhara: "Buxoro",
  buxoroda: "Buxoro", bukharada: "Buxoro",
  buxoroga: "Buxoro", bukharaga: "Buxoro",
  buxorodan: "Buxoro", bukharadan: "Buxoro",
  buxoroni: "Buxoro", bukharani: "Buxoro",
  andijon: "Andijon", andijan: "Andijon",
  andijonda: "Andijon", andijanda: "Andijon",
  andijonga: "Andijon", andijanga: "Andijon",
  andijondan: "Andijon", andijandan: "Andijon",
  andijonni: "Andijon", andijanni: "Andijon",
  "farg'ona": "Farg'ona", fargona: "Farg'ona",
  "farg'onada": "Farg'ona", fargonada: "Farg'ona",
  "farg'onaga": "Farg'ona", fargonaga: "Farg'ona",
  "farg'onadan": "Farg'ona", fargonadan: "Farg'ona",
  "farg'onani": "Farg'ona", fargonani: "Farg'ona",
  namangan: "Namangan",
  namanganda: "Namangan", namanganga: "Namangan", namangandan: "Namangan", namanganni: "Namangan",
  urganch: "Urganch",
  urganchda: "Urganch", urganchga: "Urganch", urganchdan: "Urganch", urganchni: "Urganch",
  navoiy: "Navoiy",
  navoiyda: "Navoiy", navoiyga: "Navoiy", navoiydan: "Navoiy", navoiyni: "Navoiy",
  termiz: "Termiz",
  termizda: "Termiz", termizga: "Termiz", termizdan: "Termiz", termizni: "Termiz",
  jizzax: "Jizzax", jizzakh: "Jizzax",
  jizzaxda: "Jizzax", jizzaxga: "Jizzax", jizzaxdan: "Jizzax", jizzaxni: "Jizzax",
  qarshi: "Qarshi",
  qarshida: "Qarshi", qarshiga: "Qarshi", qarshidan: "Qarshi", qarshini: "Qarshi",
  "qo'qon": "Qo'qon", qoqon: "Qo'qon",
  "qo'qonda": "Qo'qon", qoqonda: "Qo'qon",
  nukus: "Nukus",
  nukusda: "Nukus", nukusga: "Nukus", nukusdan: "Nukus", nukusni: "Nukus",
  xiva: "Xiva",
  xivada: "Xiva", xivaga: "Xiva", xivadan: "Xiva", xivani: "Xiva",
  guliston: "Guliston",
  gulistonda: "Guliston", gulistonga: "Guliston", gulistondan: "Guliston", gulistonni: "Guliston",
  denov: "Denov",
  denovda: "Denov", denovga: "Denov", denovdan: "Denov", denovni: "Denov",
};

// Профессии: специализированные (приоритет) → разговорные
const UZ_PROFESSIONS_SPECIFIC = [
  "haydovchi", "haydovchisi",
  "quruvchi", "quruvchilar", "qurilishchi",
  "chilangar", "chilangi",
  "elektrik", "elektriklar",
  "santexnik", "santexniklar",
  "payvandchi", "payvandlovchi",
  "oshpaz", "oshpazlar", "pishloqchi",
  "qo'riqchi", "qoriqchi",
  "sotuvchi", "sotuvchilar", "kassir",
  "yuk tashuvchi", "yuktashuvchi",
  "farrosh", "farroshlik",
  "tikuvchi", "tikuvchilar", "tikuv ayol",
  "texnik", "texniklar",
  "operator", "operatori",
  "kranchi", "kran operatori",
  "bo'yoqchi", "boyoqchi",
  "g'isht teruvchi", "gisht teruvchi", "g'ishtchi",
  "malyakchi", "malyak", "malyar",
  "o'qituvchi", "oqituvchi", "o'qituvchilar",
  "shifokor", "hamshira", "tibbiyot",
  "tarjimon", "tarjimoni",
  "kontroller", "nazoratchi",
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
];

const UZ_PROFESSIONS_GENERIC = [
  "ishchi", "ishchilar",
  "usta", "ustalar",
  "brigada", "brigadasi",
];

// ────────────────────────────────────────────────────────────────────
// Словарь синонимов для устойчивости к ошибкам STT.
// Применяется через normalizeInput() — паттерны ниже ищут уже
// нормализованные формы (karta, vakansiya, tarjima, haydovchi и т.д.)
// ────────────────────────────────────────────────────────────────────
const SYNONYMS: Record<string, string> = {
  // карта
  "карты": "karta", "карте": "karta", "карту": "karta", "картой": "karta", "картами": "karta",
  "harita": "xarita", "xaritta": "xarita", "haritani": "xarita", "haritada": "xarita",
  "map": "karta", "maps": "karta",
  // вакансия
  "вакансию": "vakansiya", "вакансии": "vakansiya", "вакансий": "vakansiya", "вакансиями": "vakansiya",
  "vakansia": "vakansiya", "vacansy": "vakansiya", "vacansia": "vakansiya", "vacancy": "vakansiya", "vacancies": "vakansiya",
  // перевод
  "переведи": "tarjima", "перевести": "tarjima", "перевод": "tarjima", "перевожу": "tarjima",
  "распознай": "ocr", "распознать": "ocr", "распознавание": "ocr",
  "translate": "tarjima", "translation": "tarjima", "scan": "ocr", "scanner": "ocr",
  "tarjimasi": "tarjima", "tarjimalash": "tarjima",
  // водитель
  "водитель": "haydovchi", "водителем": "haydovchi", "водителя": "haydovchi",
  "driver": "haydovchi",
  // сварщик
  "сварщик": "payvandchi", "сварщика": "payvandchi", "сварщиком": "payvandchi",
  "welder": "payvandchi",
  // строитель
  "строитель": "quruvchi", "строителя": "quruvchi", "строителей": "quruvchi",
  "builder": "quruvchi",
  // электрик
  "электрик": "elektrik", "электрика": "elektrik",
  "electrician": "elektrik",
  // магазин
  "магазин": "magazin", "магазина": "magazin", "магазине": "magazin", "магазины": "magazin",
  "shop": "magazin", "store": "magazin", "market": "magazin",
  "do'kon": "magazin", "dokon": "magazin", "magazin": "magazin",
  // больница
  "больница": "kasalxona", "больницы": "kasalxona", "больницу": "kasalxona",
  "kasalxona": "kasalxona", "shifoxona": "kasalxona",
  "hospital": "kasalxona", "clinic": "kasalxona",
  // вокзал
  "вокзал": "vokzal", "вокзала": "vokzal", "вокзалу": "vokzal",
  "vokzal": "vokzal", "vokzali": "vokzal",
  "station": "vokzal", "train station": "vokzal",
  // аэропорт
  "аэропорт": "aeroport", "аэропорта": "aeroport", "аэропорте": "aeroport",
  "aeroport": "aeroport", "aeroporti": "aeroport",
  "airport": "aeroport",
  // ближайший
  "ближайший": "eng yaqin", "ближайшая": "eng yaqin", "ближайшего": "eng yaqin",
  "nearest": "eng yaqin", "closest": "eng yaqin", "near": "eng yaqin",
  // адрес
  "адрес": "manzil", "адреса": "manzil", "адресу": "manzil",
  "manzili": "manzil", "manzilni": "manzil", "address": "manzil", "location": "manzil",
  // ищу
  "ищу": "ish top", "искать": "ish top", "найди": "ish top", "найти": "ish top",
  "find": "ish top", "search": "ish top", "look for": "ish top",
  // покажи
  "покажи": "ko'rsat", "показать": "ko'rsat", "покажет": "ko'rsat",
  "show": "ko'rsat", "display": "ko'rsat",
  // открой
  "открой": "och", "открыть": "och", "open": "och",
  // где
  "где": "qayerda", "где находится": "qayerda", "где есть": "qayerda",
  "where": "qayerda", "where is": "qayerda",
  // как пройти
  "как пройти": "marshrut", "как доехать": "marshrut", "как добраться": "marshrut",
  "маршрут": "marshrut", "маршрута": "marshrut", "маршруту": "marshrut",
  "route": "marshrut", "route to": "marshrut", "navigate to": "marshrut", "directions to": "marshrut",
  // документ
  "документ": "hujjat", "документа": "hujjat", "документе": "hujjat", "документы": "hujjat",
  "hujjat": "hujjat", "hujjatni": "hujjat",
  "document": "hujjat",
  // фото
  "фото": "rasm", "фотография": "rasm", "фотографию": "rasm", "фотографии": "rasm",
  "rasmni": "rasm", "rasmdan": "rasm",
  "photo": "rasm", "image": "rasm", "picture": "rasm",
  // текст
  "текст": "matn", "текста": "matn", "тексту": "matn",
  "matn": "matn", "matnni": "matn",
  "text": "matn",
  // сканируй / прочитай
  "сканируй": "skanerla", "сканировать": "skanerla", "скан": "skanerla",
  "skanerlash": "skanerla", "skan": "skanerla",
  "прочитай": "o'qib ber", "прочитать": "o'qib ber", "read": "o'qib ber",
};

// ────────────────────────────────────────────────────────────────────
// Правила распознавания
// ────────────────────────────────────────────────────────────────────
const RULES: Rule[] = [
  // ===== Навигация =====
  { type: "NAVIGATE_HOME", lang: ["ru","uz","en"], patterns: [
    "\\b(главн(ая|ую|ой)|home)\\b",
    "\\b(bosh sahifa|asosiy|asosiy sahifa|boshqa sahifa)\\b",
    "\\b(home|main page|homepage)\\b",
  ], baseWeight: 0.5 },
  { type: "NAVIGATE_AI", lang: ["ru","uz","en"], patterns: [
    "\\b(чат(ом|а|у)?|ai\\b|помощник|ассистент|бот)\\b",
    "\\b(chat|ai assistant|assistant)\\b",
    "\\b(chat|yordamchi|assistent|bot)\\b",
  ], baseWeight: 0.5 },
  { type: "NAVIGATE_SCANNER", lang: ["ru","uz","en"], patterns: [
    "\\b(скан(ер|ер)?|ocr|фото перевод|распозна(й|ть))\\b",
    "\\b(skaner|rasm tarjimasi|skannerlash|rasmni tarjima qil)\\b",
    "\\b(scanner|photo translation|photo translate|scan)\\b",
  ], baseWeight: 0.5 },
  { type: "NAVIGATE_PROFILE", lang: ["ru","uz","en"], patterns: [
    "\\b(профил(ь|я|ю)|кабинет|аккаунт|личн(ый|ая))\\b",
    "\\b(profil|kabinet|akkaunt|shaxsiy)\\b",
    "\\b(profile|cabinet|account|my)\\b",
  ], baseWeight: 0.5 },
  { type: "NAVIGATE_PREMIUM", lang: ["ru","uz","en"], patterns: [
    "\\b(премиум|premium|подписк(а|у|и))\\b",
    "\\b(premium|obuna|obuna bo['’]?lish)\\b",
    "\\b(premium|subscription)\\b",
  ], baseWeight: 0.5 },
  { type: "NAVIGATE_TRACKER", lang: ["ru","uz","en"], patterns: [
    "\\b(патент|календарь патент)\\b",
    "\\b(patent|patent kalendari|patent muddati)\\b",
    "\\b(patent calendar|patent)\\b",
  ], baseWeight: 0.5 },
  { type: "NAVIGATE_SOS", lang: ["ru","uz","en"], patterns: [
    "\\b(sos\\b|экстрен(ная|ый|ую)|помощь срочно|чп)\\b",
    "\\b(sos|shoshilinch yordam|shoshilinch|tezkor yordam|falokat)\\b",
    "\\b(sos|emergency|help me|urgent)\\b",
  ], baseWeight: 0.5 },
  { type: "NAVIGATE_SETTINGS", lang: ["ru","uz","en"], patterns: [
    "\\b(настройк(и|у|ам)|установк(и|у)|параметр(ы|ов))\\b",
    "\\b(sozlamalar|sozlama|tanlovlar)\\b",
    "\\b(settings|setup|preferences|options)\\b",
  ], baseWeight: 0.5 },
  { type: "NAVIGATE_ADMIN", lang: ["ru","uz","en"], patterns: [
    "\\b(админ(ка|ь)?|панель админа|администратор)\\b",
    "\\b(admin|admin paneli|administrator)\\b",
    "\\b(admin|admin panel|administrator)\\b",
  ], baseWeight: 0.5 },

  // ===== КАРТА (естественные запросы) =====
  { type: "SHOW_MAP", lang: ["ru","uz","en"], patterns: [
    // RU
    "\\bпокажи\\b.*\\b(karta|xarita)\\b",
    "\\b(открой|открыть)\\b.*\\b(karta|xarita)\\b",
    "\\b(karta|xarita)\\b.*\\b(покажи|открой|открыть|мне)\\b",
    "\\b(на|в)\\s+(karta|xarita)\\b",
    "\\bгде\\s+(наход(ится|ятся)|есть|стоит|искать)\\b",
    "\\b(найди|найти|поищи)\\b.*\\b(адрес|место|локация|магазин|больница|вокзал|аэропорт)\\b",
    "\\b(где|куда)\\s+(магазин|больница|вокзал|аэропорт|аптека|кафе|ресторан|гостиница|отель)\\b",
    "\\bпокажи\\s+(ближайший|ближайшую|ближайшее|ближайшего|eng yaqin)\\b",
    "\\b(покажи|где|как найти)\\s+(магазин|больницу|вокзал|аэропорт)\\b",
    // UZ
    "\\b(xaritani och|haritani och)\\b",
    "\\b(xarita|harita)\\s*(ko'rsat|korsat)?\\b",
    "\\b(qayerda|qayerdaligini)\\s+(magazin|shifoxona|kasalxona|vokzal|aeroport|do'kon|dokon)\\b",
    "\\b(eng yaqin)\\s+(magazin|shifoxona|kasalxona|vokzal|aeroport|do'kon|dokon)\\b",
    "\\b(marshrut qur|yo'l ko'rsat|yo'l ko'r)\\b",
    "\\b(manzil|manzilni)\\s+(top|korsat|ko'rsat)\\b",
    "\\b(manzilni top|topib ber)\\b",
    // EN
    "\\b(open|show)\\b.*\\bmap\\b",
    "\\b(where is|find)\\b.*\\b(address|place|location|hospital|station|airport|store)\\b",
    "\\b(nearest)\\s+(hospital|station|airport|store|hotel|restaurant)\\b",
    "\\b(route to|navigate to|directions to)\\b",
  ], extractQuery: true, extractCity: true, baseWeight: 0.7 },

  // Просто "покажи карту" / "open map" — навигация без query
  { type: "NAVIGATE_MAP", lang: ["ru","uz","en"], patterns: [
    "\\bпокажи\\s+(karta|xarita)\\b",
    "\\b(открой|открыть)\\s+(karta|xarita)\\b",
    "\\b(xaritani och|haritani och)\\b",
    "\\b(open|show)\\s+(map|the map)\\b",
    "\\b^karta$|^xarita$",
  ], baseWeight: 0.6 },

  // ===== ВАКАНСИИ =====
  { type: "FIND_JOBS", lang: ["ru","uz","en"], patterns: [
    // RU
    "\\b(найди|найти|поищи|покажи)\\b.*\\b(работ|ваканси|ваканс)\\b",
    "\\b(ищу|искать)\\s+(работ|ваканси|ваканс|профессия|специалист)\\b",
    "\\b(есть|имеются)\\s+(работ|ваканси|ваканс)\\b",
    "\\b(работ|ваканси|ваканс)\\s+(сварщик|водитель|строитель|электрик|разнорабочий|повар|грузчик|швея|продавец|охранник)\\w*\\b",
    "\\b(работ|ваканси)\\s+в\\s+(москв|казан|тюмен|сургут|екатеринбург|новосибирск|ташкент|самарканд|бухар|алмат|бишкек)\\w*\\b",
    "\\b(найди)\\s+(водителя|сварщика|строителя|электрика|разнорабочего)\\b",
    "\\b(ищу)\\s+(водителя|сварщика|строителя|электрика|разнорабочего)\\b",
    // UZ
    "\\b(ish top|ish qidir|ish kerak|vakansiya qidir|vakansiya top)\\b",
    "\\b(topib ber|qidirib ber|izlab top)\\b",
    "\\b(haydovchi|quruvchi|chilangar|elektrik|santexnik|payvandchi|oshpaz|farrosh)\\s+(ish|kerak)\\b",
    "\\b(ish|ishchi)\\s+(haydovchi|quruvchi|chilangar|elektrik|santexnik|payvandchi|oshpaz|farrosh)\\b",
    "\\b(moskva|toshkent|samarqand|buxoro|andijon|farg'ona|namangan)\\w*\\s+(ish|vakansiya)\\b",
    // EN
    "\\b(find|search|look for)\\b.*\\b(job|vacanc|work|position)\\b",
    "\\b(show|list)\\s+(jobs|vacancies)\\b",
    "\\b(driver|welder|builder|electrician|worker|cook)\\s+(job|vacanc|jobs|vacancies)\\b",
    "\\b(job|vacanc)\\b.*\\b(driver|welder|builder|electrician|worker|cook)\\b",
    "\\b(work|job)\\s+in\\s+(moscow|tashkent|samarkand|bukhara|andijan)\\b",
  ], extractProfession: true, extractCity: true, baseWeight: 0.75 },

  { type: "NAVIGATE_JOBS", lang: ["ru","uz","en"], patterns: [
    "\\b(вакансии|вакансий|вакансия|работ)\\b",
    "\\b(vakansiya|vakansiyalar|ish)\\b",
    "\\b(jobs|vacancy|vacancies|work)\\b",
  ], baseWeight: 0.4 },

  // ===== ПЕРЕВОД ФОТО =====
  { type: "TRANSLATE_PHOTO", lang: ["ru","uz","en"], patterns: [
    // RU
    "\\b(переведи|распознай|скан(ируй|ить)?)\\b.*\\b(фото|фотограф|картинк|изображен|документ|текст|бумаг)\\b",
    "\\b(фото|фотограф|картинк|документ)\\b.*\\b(переведи|распознай|скан(ируй|ить)?)\\b",
    "\\b(переведи)\\s+(фото|документ|текст|бумагу|скан|картинку|изображение)\\b",
    "\\b(прочитай)\\s+(документ|текст|фото|бумагу)\\b",
    "\\b(сканируй)\\s+(документ|текст|фото|бумагу)\\b",
    "\\b(ocr|распознавание)\\b.*\\b(фото|документ|текст|скан)\\b",
    // UZ
    "\\b(tarjima qil|rasmni tarjima|hujjatni tarjima|matnni tarjima|foto tarjima)\\b",
    "\\b(rasm|hujjat|matn|foto)\\s+(tarjima|o'qib ber)\\b",
    "\\b(skanerla|skanerlash|skaner qil)\\b",
    "\\b(rasmni o'qib ber|hujjatni o'qib ber|matnni o'qib ber)\\b",
    // EN
    "\\b(translate|scan|read|ocr)\\b.*\\b(photo|document|image|text|picture)\\b",
    "\\b(photo|document|image|text|picture)\\b.*\\b(translate|scan|read|ocr)\\b",
  ], baseWeight: 0.75 },

  // ===== Прочие действия =====
  { type: "WEATHER", lang: ["ru","uz","en"], patterns: [
    "\\b(погод(а|у|е|ы)|температур(а|у|ы)|какая погода)\\b",
    "\\b(ob-havo|ob havo|havo|harorat)\\b",
    "\\b(weather|temperature)\\b",
  ], extractCity: true, baseWeight: 0.5 },
  { type: "CALCULATE_90_180", lang: ["ru","uz","en"], patterns: [
    "\\b(90\\s*/\\s*180|90 на 180|90 дней|180 дней)\\b",
    "\\b(90\\s*/\\s*180|90 kun|180 kun)\\b",
    "\\b(90\\s*/\\s*180|90 days|180 days)\\b",
  ], baseWeight: 0.7 },
  { type: "SOS", lang: ["ru","uz","en"], patterns: [
    "\\b(полиц(ия|ею)|проверк(а|у|и)|останов(или|или)|задержа(ли|ть))\\b",
    "\\b(politsiya|to['’]?xat|to['’]?xtatib qol|tekshirish)\\b",
    "\\b(police|check|stop|detained|arrested)\\b",
  ], baseWeight: 0.5 },
  { type: "CHECK_EMPLOYER", lang: ["ru","uz","en"], patterns: [
    "\\b(провер(ь|ить|ить)).{0,30}\\b(работодател|компани|фирм|предприят)\\b",
    "\\b(tekshir|ish beruvchi|kompaniya|firma|tashkilot)\\b",
    "\\b(check|verify).{0,30}\\b(employer|company|firm)\\b",
  ], baseWeight: 0.5 },
];

// ────────────────────────────────────────────────────────────────────
// Кэш предкомпилированных regex (избегаем new RegExp на каждом цикле)
// ────────────────────────────────────────────────────────────────────
const REGEX_CACHE = new Map<string, RegExp>();

function getRegex(pattern: string, flags = "i"): RegExp {
  const key = `${flags}::${pattern}`;
  let re = REGEX_CACHE.get(key);
  if (!re) {
    re = new RegExp(pattern, flags);
    REGEX_CACHE.set(key, re);
  }
  return re;
}

// ────────────────────────────────────────────────────────────────────
// Утилиты
// ────────────────────────────────────────────────────────────────────
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasUzbekLatinTriggers(lowText: string): boolean {
  for (const trig of UZBEK_LATIN_TRIGGERS) {
    if (getRegex(`\\b${escapeRegex(trig)}\\b`, "i").test(lowText)) return true;
  }
  return false;
}

/**
 * Нормализация текста через словарь синонимов.
 * Заменяет STT-варианты ("карты", "vakansia", "harita") на каноны ("karta", "vakansiya", "xarita").
 * Также схлопывает множественные пробелы.
 */
function normalizeInput(text: string): string {
  let result = text.toLowerCase();
  // Сначала длинные ключи (чтобы "водителя" заменилось раньше "водитель")
  const keys = Object.keys(SYNONYMS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const re = getRegex(`\\b${escapeRegex(key)}\\b`, "g");
    result = result.replace(re, SYNONYMS[key]);
  }
  // Схлопываем пробелы и убираем ʼ/' вариации
  result = result.replace(/['ʼ]/g, "'");
  result = result.replace(/\s+/g, " ").trim();
  return result;
}

// ────────────────────────────────────────────────────────────────────
// Главная функция — определение команды
// ────────────────────────────────────────────────────────────────────
export function detectVoiceCommand(text: string, appLang: Lang = "ru"): VoiceCommand | null {
  if (!text || text.trim().length < 2) return null;
  const raw = text.trim();
  const low = normalizeInput(raw);
  const detectedLang = detectLanguageFromText(raw);

  let best: { rule: Rule; score: number } | null = null;

  for (const rule of RULES) {
    if (!rule.lang.includes(detectedLang) && !rule.lang.includes(appLang)) continue;

    let matches = 0;
    for (const pattern of rule.patterns) {
      if (getRegex(pattern, "i").test(low)) matches++;
    }
    if (matches === 0) continue;

    // Скоринг:
    //  - baseWeight (приоритет правила)
    //  - доля совпавших паттернов
    //  - бонус за совпадение с detectedLang
    //  - длинное правило = более специфичное
    const matchRatio = matches / rule.patterns.length;
    const langBonus = rule.lang.includes(detectedLang) ? 0.2 : 0;
    const specificity = Math.min(0.2, matches * 0.05);
    const score = (rule.baseWeight ?? 0.5) + matchRatio * 0.4 + langBonus + specificity;

    if (!best || score > best.score) {
      best = { rule, score };
    }
  }

  if (!best) return null;

  // Извлекаем параметры
  const params: VoiceCommand["params"] = {};
  if (best.rule.extractQuery) {
    const query = extractAfter(low, [
      "покажи", "ko'rsat", "korsat", "где", "qayerda",
      "открой", "och", "найди", "top", "show", "where",
      "where is", "find", "найти", "поищи", "ищу",
      "translate", "tarjima", "open", "nearest", "eng yaqin",
    ]);
    if (query) params.query = query;
  }
  if (best.rule.extractCity) {
    const city = extractCity(low);
    if (city) params.city = city;
  }
  if (best.rule.extractProfession) {
    const prof = extractProfession(low);
    if (prof) params.profession = prof;
  }

  // Финальный confidence: учитываем извлечённые сущности
  let finalConfidence = best.score;
  if (params.city) finalConfidence += 0.1;
  if (params.profession) finalConfidence += 0.1;
  if (params.query && params.query.length >= 3) finalConfidence += 0.05;
  finalConfidence = Math.min(1, finalConfidence);

  return {
    type: best.rule.type,
    params,
    confidence: finalConfidence,
    rawText: raw,
    language: detectedLang,
  };
}

/**
 * Детекция языка текста. Узбекский в латинице проверяется ПЕРЕД английским.
 */
function detectLanguageFromText(text: string): Lang {
  if (/[ўғқҳ]/i.test(text)) return "uz";

  const low = text.toLowerCase();
  if (hasUzbekLatinTriggers(low)) return "uz";

  const uzbekSuffixes = getRegex(
    "\\b(lar|larim|lariga|larida|lardan|ning|ni|ga|da|dan|cha|qilish|tushun|kerak|bolgan|edim|edi|miz|moq|ishlash|ishlay|yashay|yashash)\\b",
    "i"
  );
  if (uzbekSuffixes.test(low) && /[a-z]/i.test(text)) {
    const matches = low.match(uzbekSuffixes);
    if (matches && matches.length >= 1) return "uz";
  }

  if (/[а-яё]/i.test(text) && !/[a-z]/i.test(text)) return "ru";
  if (/[a-z]/i.test(text) && !/[а-яё]/i.test(text)) return "en";

  return "ru";
}

// ────────────────────────────────────────────────────────────────────
// Извлечение хвоста фразы после ключевого слова
// ────────────────────────────────────────────────────────────────────
function extractAfter(text: string, keywords: string[]): string {
  const low = text.toLowerCase();
  let best: { idx: number; rest: string } | null = null;

  for (const kw of keywords) {
    const idx = low.indexOf(kw);
    if (idx < 0) continue;
    let rest = text.slice(idx + kw.length).replace(/^(на|в|во|к|the|a|an)\s+/i, "").trim();

    // Очистка от хвостовых служебных слов и суффиксов
    const cleanPatterns = [
      // RU
      "\\b(на karta|на xarita|в городе|в ташкенте|в москве|покажи мне|пожалуйста)\\b",
      // UZ
      "\\b(xaritada|xaritada ko'rsat|xaritani|ko'rsat|korsat|qayerdaligini|qayerda|manzili|manzilni|ish top|ish qidir|ish kerak|vakansiya qidir|vakansiya top|tarjima qil)\\b",
      // EN
      "\\b(on the map|in the city|show me|find me|please)\\b",
    ];
    for (const p of cleanPatterns) {
      rest = getRegex(p, "gi").test(rest)
        ? rest.replace(getRegex(p, "gi"), "").trim()
        : rest;
    }
    rest = rest.replace(/[?.!]/g, "").trim();
    rest = rest.replace(/^(menga|мне|i want|please|пожалуйста|iltimos)\s+/i, "").trim();
    rest = rest.replace(/\s+/g, " ").trim();

    if (rest && rest.length > 1) {
      if (!best || idx < best.idx) {
        best = { idx, rest };
      }
    }
  }

  return best ? best.rest : "";
}

/**
 * Извлекает город. Поддерживает RU / UZ (cyr+lat) / EN.
 */
function extractCity(text: string): string {
  const low = text.toLowerCase();

  // 1) Узбекские города в латинице (по словарю нормализации)
  for (const variant of Object.keys(UZ_CITY_NORMALIZE)) {
    if (getRegex(`\\b${escapeRegex(variant)}\\b`, "i").test(low)) {
      return UZ_CITY_NORMALIZE[variant];
    }
  }

  // 2) Универсальный список городов
  const cities = [
    "москва", "спб", "санкт-петербург", "казань", "тюмень", "сургут",
    "екатеринбург", "новосибирск", "краснодар", "сочи",
    ...UZ_CITIES,
    "moscow", "saint petersburg", "st petersburg",
    "tashkent", "samarkand", "bukhara", "andijan",
  ];
  for (const c of cities) {
    if (low.includes(c)) {
      return c
        .split(/(\s|-)/)
        .map((part, i) => (i % 2 === 0 && part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join("");
    }
  }
  return "";
}

/**
 * Извлекает профессию. Приоритет: специализированные → RU → EN → разговорные → UZ cyr.
 */
function extractProfession(text: string): string {
  // Сначала специализированные узбекские термины (более точные)
  const specificMatches: { match: string; index: number }[] = [];
  for (const p of UZ_PROFESSIONS_SPECIFIC) {
    const idx = text.toLowerCase().indexOf(p.toLowerCase());
    if (idx >= 0) specificMatches.push({ match: p, index: idx });
  }
  if (specificMatches.length > 0) {
    specificMatches.sort((a, b) => a.index - b.index);
    return specificMatches[0].match;
  }

  const low = text.toLowerCase();

  // RU
  const ruProfs = [
    "сварщик", "водитель", "строитель", "электрик", "разнорабочий",
    "повар", "грузчик", "швея", "продавец", "охранник", "маляр", "штукатур",
  ];
  for (const p of ruProfs) if (low.includes(p)) return p;

  // EN
  const enProfs = [
    "welder", "driver", "builder", "electrician", "worker",
    "cook", "seller", "guard", "manager",
  ];
  for (const p of enProfs) if (low.includes(p)) return p;

  // Разговорные UZ (низкий приоритет)
  for (const p of UZ_PROFESSIONS_GENERIC) if (low.includes(p)) return p;

  // UZ (кириллица)
  const uzCyr = ["пайвандчи", "хайдовчи", "курувчи", "электрик", "сантехник", "бўёқчи", "уста", "молла"];
  for (const p of uzCyr) if (low.includes(p)) return p;

  return "";
}

// ────────────────────────────────────────────────────────────────────
// UI-слой вызывает это для выполнения команды
// ────────────────────────────────────────────────────────────────────
export interface CommandAction {
  type: "navigate" | "open_url" | "ai_chat" | "weather" | "none";
  path?: string;
  url?: string;
  message?: string;
  params?: Record<string, unknown>;
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
      else if (cmd.params.city) params.set("query", cmd.params.city);
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