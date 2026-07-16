/**
 * AI Assistant Engine for VaxtaGo
 * Provides rule-based responses in multiple languages
 */

export const languageGreetings: Record<string, string> = {
  ru: "Вот что я рекомендую:",
  uz: "Mana tavsiyam:",
  tg: "In tavsiyai man ast:",
  ky: "Sunušum tömöküdöy:",
  en: "Here is my recommendation:",
};

/**
 * Detect language from text or fallback to Russian
 */
export function detectLanguage(text: string): string {
  const normalized = text.toLowerCase();

  if (/\b(hello|hi|job|contract|help|police|migration)\b/.test(normalized)) {
    return "en";
  }

  if (/\b(салом|кор|шартнома|кӯмак)\b/u.test(normalized)) {
    return "tg";
  }

  if (/\b(salom|ish|yordam|shartnoma)\b/u.test(normalized)) {
    return "uz";
  }

  if (/\b(салам|иш|жардам|келишим)\b/u.test(normalized)) {
    return "ky";
  }

  return "ru";
}

/**
 * Build assistant reply based on user message and language
 */
export function buildAssistantReply(message: string, language?: string): string {
  const normalized = message.toLowerCase();
  const lang = language ?? detectLanguage(message);
  const intro = languageGreetings[lang] ?? languageGreetings.ru;

  if (normalized === "/start") {
    return "👋 Добро пожаловать в VaxtaGo Bot. Я помогу с работой, документами, проверкой работодателя, переводом и безопасностью. Напишите вопрос или используйте /help.";
  }

  if (normalized === "/help") {
    return "Команды: /start, /help, /sos, /jobs, /docs, /mvd. Также можно писать обычным текстом на русском, узбекском, таджикском, кыргызском или английском.";
  }

  if (normalized === "/sos") {
    return "🚨 Для экстренной ситуации откройте VaxtaGo и нажмите кнопку SOS. Система отправит координаты и уведомит доверенные контакты.";
  }

  if (normalized === "/jobs") {
    return "💼 Я могу подобрать вакансии с AI-анализом: зарплата, жильё, риски, реальный доход. Напишите специальность, например: 'сварщик вахта'.";
  }

  if (normalized === "/docs") {
    return "📄 Отправьте фото/PDF документа в приложении VaxtaGo: сделаю OCR, перевод, проверку ошибок и напомню сроки действия.";
  }

  if (normalized === "/mvd") {
    return "📍 Я подскажу ближайшее МВД и список документов для визита. Напишите ваш город и район.";
  }

  if (
    normalized.includes("работ") ||
    normalized.includes("vacan") ||
    normalized.includes("иш")
  ) {
    return `${intro} проверьте AI-анализ вакансии: реальный доход, риск мошенничества и рейтинг работодателя. Я уже могу подобрать вакансии сварщика, монтажника и складских работ с безопасным уровнем риска.`;
  }

  if (
    normalized.includes("договор") ||
    normalized.includes("contract") ||
    normalized.includes("шарт") ||
    normalized.includes("ҳуҷат")
  ) {
    return `${intro} загрузите фото/PDF договора — я выделю штрафы, скрытые удержания и права сотрудника простым языком на вашем языке.`;
  }

  if (normalized.includes("мвд") || normalized.includes("полиц") || normalized.includes("gov")) {
    return `${intro} ближайшие МВД отображаются в навигаторе VaxtaGo. Возьмите паспорт, миграционную карту и регистрацию. Я также подскажу часы приёма.`;
  }

  if (normalized.includes("sos") || normalized.includes("опас") || normalized.includes("help")) {
    return `${intro} нажмите кнопку SOS — платформа отправит координаты, контактный номер и тревожное уведомление семье/доверенному лицу.`;
  }

  return `${intro} я поддерживаю текст, голос, фото и PDF. Могу проверить работодателя (ИНН/ОГРН), объяснить законы, перевести документы и составить персональный roadmap.`;
}