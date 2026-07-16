import type { Lang, Vacancy } from "./types.ts";
import { t } from "./translations.ts";

export async function sendMessage(
  chatId: number,
  botToken: string,
  text: string,
  replyMarkup?: any,
): Promise<void> {
  const body: any = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error("❌ Telegram send error:", JSON.stringify(await res.json()));
}

export async function answerCallbackQuery(botToken: string, callbackId: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId }),
  });
}

export function mainMenuKeyboard(lang: Lang) {
  return {
    keyboard: [
      [
        { text: t("menu_jobs", lang) },
        { text: t("menu_scan", lang) },
      ],
      [
        { text: t("menu_translate", lang) },
        { text: t("menu_check_employer", lang) },
      ],
      [
        { text: t("menu_ai", lang) },
      ],
    ],
    resize_keyboard: true,
  };
}

export function languageKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🇷🇺 Русский", callback_data: "lang_ru" },
        { text: "🇺🇿 O'zbekcha", callback_data: "lang_uz" },
      ],
      [
        { text: "🇹🇯 Тоҷикӣ", callback_data: "lang_tg" },
        { text: "🇰🇬 Кыргызча", callback_data: "lang_ky" },
      ],
      [{ text: "🇬🇧 English", callback_data: "lang_en" }],
    ],
  };
}

export function translationLanguageKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🇺🇿 Узбекский", callback_data: "translate_uz" },
        { text: "🇷🇺 Русский", callback_data: "translate_ru" },
      ],
      [
        { text: "🇹🇯 Таджикский", callback_data: "translate_tj" },
        { text: "🇰🇬 Кыргызский", callback_data: "translate_kg" },
      ],
      [{ text: "🇬🇧 Английский", callback_data: "translate_en" }],
    ],
  };
}

export function getMenuAction(text: string, lang: Lang): string | null {
  const actions: Record<string, string> = {
    [t("menu_scan", lang)]: "scan_doc",
    [t("menu_jobs", lang)]: "jobs",
    [t("menu_translate", lang)]: "translate",
    [t("menu_check_employer", lang)]: "check_employer",
    [t("menu_documents", lang)]: "documents",
    [t("menu_ai", lang)]: "ai",
    [t("menu_settings", lang)]: "settings",
  };
  return actions[text] || null;
}

export function premiumKeyboard(lang: Lang) {
  return {
    inline_keyboard: [
      [{ text: t("btn_connect_premium", lang), callback_data: "premium:buy" }],
      [{ text: t("btn_back", lang), callback_data: "premium:back" }],
    ],
  };
}

export function visionResultKeyboard(lang: Lang) {
  return {
    inline_keyboard: [
      [
        { text: "🔄 Проверить ещё", callback_data: "vision:again" },
        { text: "🌍 Перевести", callback_data: "vision:translate" },
      ],
      [
        { text: "📄 Сохранить результат", callback_data: "vision:save" },
        { text: "💼 Найти вакансии", callback_data: "vision:jobs" },
      ],
      [{ text: "⚖️ Юридическая помощь", callback_data: "vision:lawyer" }],
    ],
  };
}

export function professionKeyboard(lang: Lang) {
  const professions = ["Сварщик", "Водитель", "Строитель", "Электрик", "Разнорабочий", "Другое"];
  return { inline_keyboard: professions.map((p) => [{ text: p, callback_data: `prof:${p}` }]) };
}

export function applyKeyboard(lang: Lang) {
  return {
    inline_keyboard: [
      [{ text: t("btn_contact_employer", lang), callback_data: "apply:contact" }],
      [{ text: t("btn_create_resume", lang), callback_data: "apply:resume" }],
    ],
  };
}

export function vacancyCardText(v: Vacancy, lang: Lang): string {
  return (
    `━━━━━━━━━━━━━━\n\n` +
    `👷 ${v.title}\n\n🏢 ${v.company}\n\n📍 ${v.city}\n\n💰 ${v.salary}\n\n🏠 ${v.housing || "Не указано"}\n\n🕒 ${v.schedule || "Не указано"}\n\n🔗 HeadHunter\n\n━━━━━━━━━━━━━━`
  );
}

export function vacancyInlineKeyboard(v: Vacancy, lang: Lang) {
  return {
    inline_keyboard: [
      [
        { text: t("btn_apply", lang), callback_data: `vac:apply:${v.hhId}` },
        { text: t("btn_save", lang), callback_data: `vac:save:${v.hhId}` },
      ],
      [{ text: t("btn_check_employer", lang), callback_data: `vac:check:${v.hhId}` }],
      [{ text: t("btn_open", lang), url: v.url }],
    ],
  };
}

export async function sendVacancyCard(chatId: number, botToken: string, v: Vacancy, lang: Lang): Promise<void> {
  await sendMessage(chatId, botToken, vacancyCardText(v, lang), vacancyInlineKeyboard(v, lang));
}

export function savedVacancyInlineKeyboard(id: string, url: string, lang: Lang) {
  return {
    inline_keyboard: [
      [
        { text: "🗑 Удалить", callback_data: `cab:vac:delete:${id}` },
        { text: t("btn_open", lang), url: url },
      ],
    ],
  };
}

export async function sendSavedVacancyCard(chatId: number, botToken: string, s: any, lang: Lang): Promise<void> {
  const v: Vacancy = {
    hhId: s.vacancy_id, title: s.title, company: s.company, city: s.city,
    salary: s.salary, url: s.url, schedule: s.schedule || "Не указано", housing: s.housing || "Не указано",
  };
  await sendMessage(chatId, botToken, vacancyCardText(v, lang), savedVacancyInlineKeyboard(String(s.id), s.url, lang));
}

export function formatProfile(user: any, lang: Lang, usage: any): string {
  if (!user) return t("profile", lang);
  const status = user.subscription_status || "FREE";
  const tariffName = status === "PREMIUM" ? "PREMIUM" : "FREE";
  const limits = [
    `🤖 AI: ${3 - (usage.ai_requests ?? 0)}/3`,
    `📄 Перевод: ${3 - (usage.translations ?? 0)}/3`,
    `📷 Анализ: ${3 - (usage.document_scans ?? 0)}/3`,
    `⚖️ Работодатель: ${3 - (usage.employer_checks ?? 0)}/3`,
    `🔍 Вакансии: ∞`,
    `🚆 Маршруты: ∞`,
    `ℹ️ Справка: ∞`,
  ].join("\n");

  return (
    `👤 ${t("profile", lang)}\n\n` +
    `${t("profile_tariff_label", lang)}: ${tariffName}\n\n` +
    `${t("profile_limits_label", lang)}:\n${limits}`
  );
}