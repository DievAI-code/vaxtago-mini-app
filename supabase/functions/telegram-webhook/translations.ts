import type { Lang } from "./types.ts";

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  ru: {
    premium_info: "⭐ VAQTA AI Premium активирован!",
    buy_premium: "💳 Купить Premium",
    premium_feature_locked: "⭐ Эта функция доступна в VAQTA AI Premium",
    payment_success: "🎉 Оплата успешно завершена!",
  },
  uz: {
    premium_info: "⭐ VAQTA AI Premium faollashtirildi!",
    buy_premium: "💳 Premium sotib olish",
    premium_feature_locked: "⭐ Bu funksiya VAQTA AI Premiumda mavjud",
    payment_success: "🎉 To'lov muvaffaqiyatli yakunlandi!",
  }
  // Добавить tg, ky, en по аналогии
};

export function t(key: string, lang: string): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.ru[key] ?? key;
}