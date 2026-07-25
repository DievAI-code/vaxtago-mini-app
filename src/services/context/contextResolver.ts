/**
 * ContextResolver — ядро системы контекста.
 *
 * Принимает: текущий текст пользователя + предыдущий SessionContext +
 * результат распознавания намерения (IntentResult) → возвращает
 * ContextResolution с объединёнными сущностями и решением,
 * какое намерение использовать.
 *
 * Логика:
 *  1. Если текст содержит только clarifying-слова (там, ещё, etc.) →
 *     использовать предыдущий intent.
 *  2. Если текст — AI follow-up (расскажи подробнее, почему?) →
 *     использовать предыдущий intent, расширить query.
 *  3. Если текст — save/share/more/apply/etc команда →
 *     установить command, использовать предыдущий контекст.
 *  4. Если новое намерение с высокой уверенностью и в другом семействе →
 *     сменить тему, push старого в историю.
 *  5. Иначе → использовать новое намерение, обогатив сущности из
 *     предыдущего контекста (если новые не заданы).
 *  6. Склеить фрагменты сообщений в пределах FRAGMENT_WINDOW_MS.
 */

import type { Lang } from "@/i18n";
import type {
  ExtractedEntities,
  IntentAction,
  IntentResult,
  IntentType,
} from "@/services/intent";
import type {
  ContextCommand,
  ContextResolution,
  ContextResolutionUpdate,
  DocumentSnapshot,
  MapObjectSnapshot,
  SessionContext,
  TranslationSnapshot,
} from "./types";
import { FRAGMENT_WINDOW_MS, isSameFamily } from "./sessionContext";
import { ConversationMemory } from "./conversationMemory";

// ────────────────────────────────────────────────────────────────────
// Словари паттернов
// ────────────────────────────────────────────────────────────────────

type LangKey = "ru" | "uz" | "en";

/** Слова-указатели, которые сами по себе не несут нового намерения */
const CLARIFYING_WORDS: Record<LangKey, string[]> = {
  ru: [
    "там", "сюда", "туда", "здесь", "рядом", "поблизости", "в центре", "в городе",
    "ещё", "ещё раз", "дальше", "потом", "затем",
    "следующий", "следующая", "следующее", "следующие", "следующих",
    "этот", "эта", "это", "эти", "тот", "та", "то", "те",
    "другой", "другая", "другое", "другие", "аналогично", "так же", "также",
    "поближе", "подальше", "побольше", "поменьше", "ещё один", "ещё одну", "ещё один",
    "оттуда", "тут", "здесь",
  ],
  uz: [
    "u yerda", "shu yerda", "o'sha yerda", "bu yerda", "shu yerga", "o sha yerda", "shu yerdan",
    "yonida", "yaqinda", "yaqinida", "bu yerdagi", "o'sha yerdagi",
    "yana", "yana bir", "yana ko'rsat", "davom et", "davomi",
    "keyingi", "keyingisi", "keyingilariga",
    "bu", "shu", "o'sha", "boshqa", "boshqasi",
    "yaqinroq", "uzoqroq", "kattaroq", "kichikroq",
  ],
  en: [
    "there", "here", "nearby", "around", "close", "in the area", "in the city",
    "more", "more options", "show more", "next", "previous",
    "this", "that", "these", "those", "the same",
    "another", "other", "another one", "more of",
    "closer", "further", "bigger", "smaller",
  ],
};

/** Фразы, продолжающие AI-ответ (расскажи подробнее, почему?) */
const AI_FOLLOW_UP: Record<LangKey, string[]> = {
  ru: [
    "расскажи подробнее", "расскажи ещё", "подробнее", "побольше деталей",
    "почему", "зачем", "откуда", "как так", "как это работает",
    "объясни", "поясни", "уточни", "а как", "а что", "а если",
    "что дальше", "что потом", "что ещё", "что ещё можно",
    "есть другой способ", "есть варианты", "что лучше", "что выгоднее", "что дешевле",
    "а если иначе", "а по-другому", "а можно",
    "а ты уверен", "точно", "точно ли", "серьёзно",
    "не понял", "не понимаю", "повтори", "ещё раз объясни",
    "что значит", "что означает", "что это",
    "и что", "и как", "и где",
  ],
  uz: [
    "batafsil", "yanada batafsil", "ko'proq", "yanada ko'proq",
    "nega", "negadir", "qanday qilib", "qanday ishlaydi",
    "tushuntir", "tushuntirib ber", "aniqlashtir",
    "nima uchun", "nima sababdan", "qayerdan",
    "yana nima", "yana qanday", "keyingi",
    "boshqa yo'l", "boshqa variant",
    "qaysi biri yaxshi", "qaysi arzon",
    "boshqacha", "boshqacha qilib",
  ],
  en: [
    "tell me more", "more details", "more about", "elaborate",
    "why", "why so", "how so", "how does it work",
    "explain", "clarify", "what about",
    "what's next", "what else", "what then",
    "is there another way", "any options", "which is better", "which is cheaper",
    "what if", "alternatively", "otherwise",
    "are you sure", "really", "seriously",
    "i don't understand", "didn't get it", "repeat",
    "what does it mean", "what is",
  ],
};

/** Save / share / bookmark / apply / call команды */
const SAVE_COMMANDS: Record<LangKey, string[]> = {
  ru: [
    "сохрани", "сохранить", "сохрани это", "сохрани мне", "сохрани тут",
    "запомни", "запомни это", "запомни мне",
    "добавь в избранное", "в избранное", "в закладки", "закладка", "сохрани вакансию", "сохрани вакансии",
    "сохрани документ", "сохрани место", "сохрани перевод", "сохрани адрес",
  ],
  uz: ["saqlash", "saqlab qolish", "saqlab qo'yish", "eslab qolish", "saqlang", "bu yerni saqlang", "sevimlilarga"],
  en: [
    "save", "save this", "save it", "remember", "remember this",
    "save the job", "save the document", "save the place", "save the address",
    "bookmark", "favorite", "add to favorites", "star it",
  ],
};

const SHARE_COMMANDS: Record<LangKey, string[]> = {
  ru: [
    "отправь", "отправить", "поделись", "поделиться", "скинь", "шли",
    "отправь мне", "шли мне", "расшарь", "шарь", "отправь другу",
    "отправь в мессенджер", "отправь в телеграм", "отправь в whatsapp",
  ],
  uz: ["yuborish", "ulashish", "jo'natish", "yubor", "jo'nat", "ulash", "yuboring"],
  en: ["send", "share", "forward", "send to me", "email", "message", "share with", "send via"],
};

const MORE_COMMANDS: Record<LangKey, string[]> = {
  ru: [
    "ещё", "ещё раз", "ещё варианты", "покажи ещё", "побольше",
    "следующий", "следующая", "следующее", "следующие", "следующих",
    "дальше", "продолжи", "продолжить", "ещё результаты", "ещё страницу",
    "листай дальше", "ещё места", "больше мест", "больше вариантов",
  ],
  uz: [
    "yana", "yana bir", "yana ko'rsat", "ko'proq", "ko'proq variant",
    "keyingi", "keyingisi", "keyingilariga",
    "davom et", "davomi", "boshqa variantlar", "yana variantlar", "yana natija",
  ],
  en: [
    "more", "show more", "next", "next page", "continue",
    "more results", "more options", "more variants",
    "show next", "load more", "see more", "more of these",
  ],
};

const APPLY_COMMANDS: Record<LangKey, string[]> = {
  ru: [
    "откликнуться", "отклик", "подать заявку", "подать", "хочу работать",
    "хочу эту работу", "откликнутся", "откликнуться на вакансию", "отправить резюме",
    "отправить отклик", "оставить заявку", "записаться",
  ],
  uz: [
    "javob berish", "rezume yuborish", "ariza berish", "ishlamoqchiman",
    "bu ishni xohlayman", "menga yoqdi", "ariza topshirish",
  ],
  en: [
    "apply", "apply now", "send resume", "submit application",
    "i want this job", "i want to work", "apply for this",
  ],
};

const CALL_COMMANDS: Record<LangKey, string[]> = {
  ru: ["позвони", "позвонить", "телефон", "номер телефона", "набери", "звонок", "позвони туда"],
  uz: ["qo'ng'iroq qilish", "telefon", "telefon raqami", "qung'iroq", "qong'iroq"],
  en: ["call", "phone", "phone number", "dial", "call there", "ring up"],
};

const HOURS_COMMANDS: Record<LangKey, string[]> = {
  ru: [
    "часы работы", "расписание", "когда работает", "время работы",
    "до скольки работает", "расписание работы", "когда открыто", "когда закрыто",
    "график работы", "часы",
  ],
  uz: ["ish vaqti", "jadval", "qachon ishlaydi", "ochilish vaqti", "yopilish vaqti", "ish grafigi"],
  en: ["hours", "working hours", "schedule", "opening hours", "when is it open", "open hours", "business hours"],
};

const OPEN_COMMANDS: Record<LangKey, string[]> = {
  ru: ["открой", "открыть", "перейди", "перейти", "зайди", "зайти"],
  uz: ["ochish", "och", "o'tish", "o't", "kirish", "kir"],
  en: ["open", "open it", "go to", "navigate to", "launch"],
};

const READ_AGAIN_COMMANDS: Record<LangKey, string[]> = {
  ru: ["прочитай ещё раз", "прочитай снова", "повтори", "ещё раз прочитай", "прочитай заново"],
  uz: ["yana o'qish", "yana o'qib ber", "qayta o'qish", "takrorlash"],
  en: ["read again", "read once more", "repeat reading", "read it again", "rerun ocr"],
};

const TRANSLATE_BACK_COMMANDS: Record<LangKey, string[]> = {
  ru: ["переведи обратно", "обратный перевод", "переведи назад", "обратно переведи", "перевод обратно"],
  uz: ["teskari tarjima", "orqaga tarjima", "qayta tarjima"],
  en: ["translate back", "back translation", "reverse translate"],
};

const ROUTE_TO_COMMANDS: Record<LangKey, string[]> = {
  ru: ["маршрут", "как доехать", "как добраться", "проложи маршрут", "построй маршрут", "как туда добраться"],
  uz: ["marshrut", "qanday borish", "qanday yetib borish", "marshrut qur", "yo'l ko'rsat"],
  en: ["route", "directions", "navigate", "how to get there", "build a route"],
};

// ────────────────────────────────────────────────────────────────────
// Утилиты для определения типов сообщений
// ────────────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[,.!?:;'"`~(){}\[\]]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function getLangFromText(text: string, ctx: SessionContext, appLang: Lang): Lang {
  if (text) {
    if (/[ўғқҳ]/i.test(text)) return "uz";
    if (/\b(toshkent|samarqand|haydovchi|quruvchi|ish|kerak|qayerda|ko'rsat)\b/i.test(text)) {
      return "uz";
    }
    if (/[a-z]/i.test(text) && !/[а-яё]/i.test(text)) return "en";
  }
  return ctx.language ?? appLang;
}

function isOnlyClarifying(text: string, lang: LangKey): boolean {
  const tokens = tokenize(text);
  if (tokens.length === 0) return false;
  const all = CLARIFYING_WORDS[lang];
  if (!all) return false;
  return tokens.every((t) => all.includes(t));
}

function hasAny(text: string, list: string[]): boolean {
  const low = text.toLowerCase().trim();
  if (!low) return false;
  return list.some((p) => low.includes(p.toLowerCase()));
}

function detectCommandType(
  text: string,
  lang: LangKey,
): ContextCommand | null {
  if (hasAny(text, SAVE_COMMANDS[lang])) return "save";
  if (hasAny(text, SHARE_COMMANDS[lang])) return "share";
  if (hasAny(text, MORE_COMMANDS[lang])) return "more";
  if (hasAny(text, APPLY_COMMANDS[lang])) return "apply";
  if (hasAny(text, CALL_COMMANDS[lang])) return "call";
  if (hasAny(text, HOURS_COMMANDS[lang])) return "open_hours";
  if (hasAny(text, READ_AGAIN_COMMANDS[lang])) return "read_again";
  if (hasAny(text, TRANSLATE_BACK_COMMANDS[lang])) return "translate_back";
  if (hasAny(text, OPEN_COMMANDS[lang])) return "open_object";
  if (hasAny(text, ROUTE_TO_COMMANDS[lang])) return "route_to_object";
  return null;
}

function isAIFollowUpText(text: string, lang: LangKey): boolean {
  if (hasAny(text, AI_FOLLOW_UP[lang])) return true;
  // Вопросительное предложение без явного маркера темы
  const low = text.toLowerCase().trim();
  if (low.endsWith("?") || low.endsWith("?")) return true;
  return false;
}

// ────────────────────────────────────────────────────────────────────
// Главный класс
// ────────────────────────────────────────────────────────────────────

export class ContextResolver {
  private readonly memory = new ConversationMemory();

  /**
   * Главный метод: объединяет результат распознавания намерения с
   * предыдущим контекстом, принимает решение о continuation / new topic.
   */
  resolve(
    rawText: string,
    ctx: SessionContext,
    intentResult: IntentResult | null,
    appLang: Lang,
  ): ContextResolution {
    const now = Date.now();
    const language = getLangFromText(rawText, ctx, appLang);
    const lang: LangKey = language as LangKey;

    // ─── 0. Склейка фрагментов сообщений ───
    let workingText = rawText.trim();
    let pendingCleared = false;
    if (
      ctx.pendingFragment &&
      now - ctx.lastMessageAt < FRAGMENT_WINDOW_MS
    ) {
      workingText = `${ctx.pendingFragment} ${rawText.trim()}`.trim();
      pendingCleared = true;
    }
    // Если текст выглядит как фрагмент — сохраним как pending
    const looksLikeFragment =
      workingText.length < 80 && !hasAny(workingText, [".", "?", "!"]);

    // ─── 1. Базовая инициализация ───
    const result: ContextResolution = {
      intent: intentResult?.intent ?? ctx.lastIntent ?? "AI_CHAT",
      entities: intentResult?.entities ?? {},
      originalEntities: intentResult?.entities ?? {},
      route: intentResult?.route ?? ctx.lastRoute ?? "/ai",
      action: intentResult?.action ?? "ai_chat",
      reply: intentResult?.reply ?? "",
      confidence: intentResult?.confidence ?? 0,
      language,
      contextUsed: [],
      isContinuation: false,
      topicChanged: false,
      contextExpired: false,
      command: undefined,
      combinedText: workingText,
      rawText,
      normalizedText: intentResult?.normalizedText ?? workingText.toLowerCase(),
      pendingFragment: looksLikeFragment ? workingText : undefined,
    };

    // ─── 2. Команда save/share/more/apply/... ───
    const cmd = detectCommandType(workingText, lang);
    if (cmd) {
      // Используем предыдущий intent, если он есть
      if (ctx.lastIntent) {
        result.intent = ctx.lastIntent;
        result.action = mapCommandToAction(ctx.lastIntent, cmd);
        result.command = cmd;
        result.contextUsed.push(`command:${cmd}`);
        result.contextUsed.push(`intent:${ctx.lastIntent}`);
        result.isContinuation = true;
        result.reply = buildCommandReply(cmd, lang);
        result.route = routeForCommand(ctx.lastIntent, cmd);
        result.entities = buildEntityFromContext(ctx, intentResult?.entities ?? {});
        result.confidence = Math.max(result.confidence, 0.7);
        return result;
      }
      // Нет контекста — не можем выполнить команду
      result.intent = "AI_CHAT";
      result.action = "ai_chat";
      result.command = cmd;
      result.reply = buildCommandReplyNoContext(cmd, lang);
      result.route = "/ai";
      return result;
    }

    // ─── 3. Pure clarifying + previous context ───
    const noIntent = !intentResult || (intentResult.confidence < 0.3 && !intentResult.intent);
    if (isOnlyClarifying(workingText, lang) || (noIntent && isAIFollowUpText(workingText, lang))) {
      if (ctx.lastIntent) {
        result.intent = ctx.lastIntent;
        result.action = mapActionFromIntent(ctx.lastIntent, ctx.lastAction);
        result.route = ctx.lastRoute ?? routeForIntent(ctx.lastIntent);
        result.entities = buildEntityFromContext(ctx, intentResult?.entities ?? {});
        result.isContinuation = true;
        result.contextUsed.push("intent");
        if (ctx.lastCity && !result.entities.city) result.contextUsed.push("city");
        if (ctx.lastProfession && !result.entities.profession) result.contextUsed.push("profession");
        if (ctx.lastOrg && !result.entities.orgName) result.contextUsed.push("org");
        result.reply = result.reply || buildClarifyingReply(ctx, lang);
        result.confidence = Math.max(result.confidence, ctx.lastIntent ? 0.6 : 0.3);
        return result;
      }
    }

    // ─── 4. AI follow-up (расскажи подробнее, почему?) ───
    if (intentResult && isAIFollowUpText(workingText, lang) && ctx.lastAIAnswer) {
      result.intent = "AI_CHAT";
      result.action = "ai_chat";
      result.route = "/ai";
      result.entities = buildEntityFromContext(ctx, intentResult.entities);
      result.entities.textObject = workingText;
      result.isContinuation = true;
      result.contextUsed.push("ai_followup");
      result.contextUsed.push("lastAIAnswer");
      result.reply = "";
      result.confidence = Math.max(result.confidence, 0.65);
      return result;
    }

    // ─── 5. Нет нового намерения — fallback на предыдущее ───
    if (!intentResult || !intentResult.intent) {
      if (ctx.lastIntent) {
        result.intent = ctx.lastIntent;
        result.action = mapActionFromIntent(ctx.lastIntent, ctx.lastAction);
        result.route = ctx.lastRoute ?? routeForIntent(ctx.lastIntent);
        result.entities = buildEntityFromContext(ctx, {});
        result.isContinuation = true;
        result.contextUsed.push("fallback");
        result.reply = result.reply || buildClarifyingReply(ctx, lang);
        return result;
      }
      return result;
    }

    // ─── 6. Проверка смены темы ───
    const newIntent = intentResult.intent;
    const sameFamily = isSameFamily(newIntent, ctx.lastIntent);
    const newConfidence = intentResult.confidence ?? 0;

    if (ctx.lastIntent && !sameFamily && newConfidence >= 0.4) {
      // Смена темы → push старого в историю
      this.memory.push(ctx, ctx.lastIntent, {
        city: ctx.lastCity,
        cityCountry: ctx.lastCityCountry,
        profession: ctx.lastProfession,
        orgName: ctx.lastOrg,
        placeCategory: ctx.lastPlace?.category as ExtractedEntities["placeCategory"],
        textObject: ctx.lastQueryText,
      });
      result.topicChanged = true;
      result.contextUsed.push("topic_change");
    }

    // ─── 7. Обогащение сущностей из контекста ───
    if (newConfidence > 0 && !result.topicChanged) {
      const merged = mergeEntitiesFromContext(ctx, intentResult.entities);
      result.entities = merged;
      for (const k of mergedKeys(ctx, intentResult.entities)) {
        result.contextUsed.push(k);
      }
      result.route = rebuildRoute(newIntent, merged, lang);
      result.reply = intentResult.reply;
      result.confidence = intentResult.confidence;
    } else {
      result.entities = intentResult.entities;
      result.route = intentResult.route;
      result.reply = intentResult.reply;
      result.confidence = intentResult.confidence;
    }

    if (pendingCleared) {
      result.contextUsed.push("fragment_merged");
    }

    return result;
  }
}

// ────────────────────────────────────────────────────────────────────
// Helper: merge entities с приоритетом текущего сообщения
// ────────────────────────────────────────────────────────────────────

function buildEntityFromContext(
  ctx: SessionContext,
  current: ExtractedEntities,
): ExtractedEntities {
  return {
    city: current.city ?? ctx.lastCity,
    cityCountry: current.cityCountry ?? ctx.lastCityCountry,
    profession: current.profession ?? ctx.lastProfession,
    orgName: current.orgName ?? ctx.lastOrg,
    placeCategory: current.placeCategory ?? (ctx.lastPlace?.category as ExtractedEntities["placeCategory"]),
    placeDisplay: current.placeDisplay,
    routeFromTo: current.routeFromTo,
    textObject: current.textObject,
    documentType: current.documentType,
  };
}

function mergeEntitiesFromContext(
  ctx: SessionContext,
  current: ExtractedEntities,
): ExtractedEntities {
  const merged = buildEntityFromContext(ctx, current);
  // Для маршрута — сохраняем from, дополняем to из контекста
  if (current.routeFromTo) {
    merged.routeFromTo = {
      from: current.routeFromTo.from ?? ctx.lastCity,
      to: current.routeFromTo.to ?? ctx.lastPlace?.address ?? ctx.lastPlace?.name,
    };
  }
  return merged;
}

function mergedKeys(ctx: SessionContext, current: ExtractedEntities): string[] {
  const used: string[] = [];
  if (ctx.lastCity && !current.city) used.push("city");
  if (ctx.lastProfession && !current.profession) used.push("profession");
  if (ctx.lastOrg && !current.orgName) used.push("org");
  if (ctx.lastPlace && !current.placeCategory) used.push("place");
  if (ctx.lastJobQuery && !current.profession) used.push("jobQuery");
  if (ctx.lastDocument && !current.documentType) used.push("document");
  if (ctx.lastTranslation && !current.textObject) used.push("translation");
  return used;
}

// ────────────────────────────────────────────────────────────────────
// Helper: route / action / reply
// ────────────────────────────────────────────────────────────────────

function routeForIntent(intent: IntentType): string {
  switch (intent) {
    case "JOB_SEARCH":
    case "OPEN_VACANCIES_LIST":
    case "NAVIGATE_JOBS":
      return "/jobs-test";
    case "MAP_SEARCH":
    case "MAP_ROUTE":
    case "NAVIGATE_MAP":
      return "/maps";
    case "OCR_TRANSLATE":
    case "NAVIGATE_SCANNER":
      return "/scanner";
    case "DOCUMENT_CHECK":
    case "EMPLOYER_CHECK":
    case "AI_CHAT":
    case "NAVIGATE_AI":
      return "/ai";
    case "SOS":
    case "NAVIGATE_SOS":
      return "/sos";
    case "PREMIUM":
    case "NAVIGATE_PREMIUM":
      return "/premium";
    case "NAVIGATE_HOME":
      return "/home";
    case "NAVIGATE_PROFILE":
      return "/cabinet";
    case "NAVIGATE_TRACKER":
      return "/tracker";
    case "NAVIGATE_SETTINGS":
      return "/settings";
    case "VOICE_SETTINGS":
      return "/settings/voice";
    case "NAVIGATE_ADMIN":
      return "/admin/login";
    case "NAVIGATE_HISTORY":
      return "/history";
    case "WEATHER":
      return "/maps";
    case "CALCULATE_90_180":
      return "/tracker";
    default:
      return "/ai";
  }
}

function rebuildRoute(
  intent: IntentType,
  entities: ExtractedEntities,
  _lang: Lang,
): string {
  const params = new URLSearchParams();
  const base = routeForIntent(intent);
  if (intent === "MAP_SEARCH") {
    if (entities.textObject) params.set("search", entities.textObject);
    else if (entities.placeDisplay?.ru) params.set("search", entities.placeDisplay.ru);
    else if (entities.orgName) params.set("search", entities.orgName);
    else if (entities.city) params.set("search", entities.city);
  } else if (intent === "MAP_ROUTE") {
    if (entities.routeFromTo?.from) params.set("from", entities.routeFromTo.from);
    if (entities.routeFromTo?.to) params.set("to", entities.routeFromTo.to);
    if (entities.city && !entities.routeFromTo?.from) params.set("from", entities.city);
  } else if (intent === "JOB_SEARCH" || intent === "OPEN_VACANCIES_LIST") {
    if (entities.profession) params.set("query", entities.profession);
    else if (entities.textObject) params.set("query", entities.textObject);
    if (entities.city) params.set("city", entities.city);
  } else if (intent === "OCR_TRANSLATE") {
    if (entities.documentType) params.set("type", entities.documentType);
    if (entities.textObject) params.set("text", entities.textObject);
  } else if (intent === "WEATHER") {
    if (entities.city) params.set("city", entities.city);
  } else if (intent === "AI_CHAT") {
    if (entities.textObject) params.set("q", entities.textObject);
  }
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

function mapActionFromIntent(intent: IntentType, prevAction?: IntentAction): IntentAction {
  if (prevAction) return prevAction;
  switch (intent) {
    case "JOB_SEARCH":
    case "OPEN_VACANCIES_LIST":
    case "NAVIGATE_JOBS":
      return "open_jobs";
    case "MAP_SEARCH":
    case "MAP_ROUTE":
    case "NAVIGATE_MAP":
    case "WEATHER":
      return "open_map";
    case "OCR_TRANSLATE":
    case "NAVIGATE_SCANNER":
      return "open_scanner";
    case "DOCUMENT_CHECK":
    case "EMPLOYER_CHECK":
    case "AI_CHAT":
    case "NAVIGATE_AI":
      return "ai_chat";
    case "SOS":
    case "NAVIGATE_SOS":
      return "open_sos";
    case "PREMIUM":
    case "NAVIGATE_PREMIUM":
      return "open_premium";
    case "NAVIGATE_PROFILE":
      return "open_profile";
    case "NAVIGATE_HISTORY":
      return "open_history";
    case "NAVIGATE_TRACKER":
      return "open_calendar";
    case "NAVIGATE_SETTINGS":
      return "open_settings";
    case "VOICE_SETTINGS":
      return "open_voice_settings";
    case "NAVIGATE_ADMIN":
      return "open_admin";
    case "NAVIGATE_HOME":
      return "open_home";
    case "CALCULATE_90_180":
      return "navigate";
    default:
      return "ai_chat";
  }
}

function mapCommandToAction(_intent: IntentType, _cmd: ContextCommand): IntentAction {
  // Все команды → stay on the same page, but UI should look at .command
  // The action here is a hint to UI that something different should happen.
  return "ai_chat";
}

function routeForCommand(intent: IntentType, cmd: ContextCommand): string {
  // Остаёмся на той же странице, где был пользователь
  const base = routeForIntent(intent);
  if (cmd === "more") {
    // Pagination — добавим параметр
    return `${base}?more=1`;
  }
  return base;
}

// ────────────────────────────────────────────────────────────────────
// Reply builders
// ────────────────────────────────────────────────────────────────────

function buildClarifyingReply(ctx: SessionContext, lang: LangKey): string {
  const parts: string[] = [];
  if (ctx.lastPlace) parts.push(ctx.lastPlace.name);
  if (ctx.lastCity) parts.push(ctx.lastCity);
  if (parts.length === 0) {
    return lang === "uz" ? "Aniqlashtirish kerak" : lang === "en" ? "Need clarification" : "Нужно уточнение";
  }
  return lang === "uz"
    ? `${parts.join(", ")} haqida batafsil`
    : lang === "en"
    ? `More about ${parts.join(", ")}`
    : `Подробнее о ${parts.join(", ")}`;
}

function buildCommandReply(cmd: ContextCommand, lang: LangKey): string {
  const messages: Record<ContextCommand, Record<LangKey, string>> = {
    save: {
      ru: "Сохраняю в избранное",
      uz: "Saqlayapman",
      en: "Saving",
    },
    share: {
      ru: "Подготавливаю ссылку для отправки",
      uz: "Yuborish uchun tayyorlayapman",
      en: "Preparing to share",
    },
    more: {
      ru: "Показываю следующие результаты",
      uz: "Keyingi natijalarni ko'rsataman",
      en: "Showing more results",
    },
    apply: {
      ru: "Готовлю отклик на вакансию",
      uz: "Vakansiyaga javob tayyorlayapman",
      en: "Preparing to apply",
    },
    call: {
      ru: "Открываю телефон",
      uz: "Telefonni ochayapman",
      en: "Opening phone",
    },
    open_hours: {
      ru: "Показываю часы работы",
      uz: "Ish vaqtini ko'rsataman",
      en: "Showing working hours",
    },
    open_object: {
      ru: "Открываю карточку",
      uz: "Kartani ochayapman",
      en: "Opening card",
    },
    read_again: {
      ru: "Читаю документ заново",
      uz: "Hujjatni qayta o'qiyapman",
      en: "Reading again",
    },
    translate_back: {
      ru: "Перевожу обратно",
      uz: "Teskari tarjima qilayapman",
      en: "Translating back",
    },
    route_to_object: {
      ru: "Строю маршрут",
      uz: "Marshrut quryapman",
      en: "Building route",
    },
  };
  return messages[cmd]?.[lang] ?? messages[cmd]?.ru ?? "OK";
}

function buildCommandReplyNoContext(cmd: ContextCommand, lang: LangKey): string {
  const messages: Record<ContextCommand, Record<LangKey, string>> = {
    save: {
      ru: "Нечего сохранять. Сначала найдите что-нибудь.",
      uz: "Saqlash uchun hech narsa yo'q. Avval nimadir toping.",
      en: "Nothing to save. Please find something first.",
    },
    share: {
      ru: "Нечего отправлять. Сначала найдите что-нибудь.",
      uz: "Yuborish uchun hech narsa yo'q. Avval nimadir toping.",
      en: "Nothing to share. Please find something first.",
    },
    more: {
      ru: "Нечего показывать. Сначала найдите что-нибудь.",
      uz: "Ko'rsatish uchun hech narsa yo'q.",
      en: "Nothing more to show. Please find something first.",
    },
    apply: {
      ru: "Сначала найдите вакансию.",
      uz: "Avval vakansiya toping.",
      en: "Please find a job first.",
    },
    call: {
      ru: "Сначала найдите место на карте.",
      uz: "Avval xaritada joy toping.",
      en: "Please find a place first.",
    },
    open_hours: {
      ru: "Сначала найдите место на карте.",
      uz: "Avval xaritada joy toping.",
      en: "Please find a place first.",
    },
    open_object: {
      ru: "Сначала найдите место на карте.",
      uz: "Avval xaritada joy toping.",
      en: "Please find a place first.",
    },
    read_again: {
      ru: "Сначала переведите документ.",
      uz: "Avval hujjatni tarjima qiling.",
      en: "Please translate a document first.",
    },
    translate_back: {
      ru: "Сначала переведите документ.",
      uz: "Avval hujjatni tarjima qiling.",
      en: "Please translate a document first.",
    },
    route_to_object: {
      ru: "Сначала найдите точку на карте.",
      uz: "Avval xaritada nuqtani toping.",
      en: "Please find a place first.",
    },
  };
  return messages[cmd]?.[lang] ?? messages[cmd]?.ru ?? "Нет контекста";
}