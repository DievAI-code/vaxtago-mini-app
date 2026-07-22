/// <reference path="../deno-env.d.ts" />
import type { Lang } from "./types.ts";
import { t } from "./translations.ts";
import { getOrCreateUser, setLanguage, isPremiumActive } from "./user.ts";
import { sendMessage, answerCallbackQuery } from "./telegram.ts";
import { createPremiumInvoice, activatePremiumSubscription, answerPreCheckoutQuery } from "./telegram-payment.ts";
import { getAIResponse } from "./ai.ts";
import { analyzeDocument } from "./vision.ts";

const MINI_APP_URL = Deno.env.get("MINI_APP_URL") ?? "https://vaxtago.app";

export async function processCallbackQuery(body: any, supabase: any, botToken: string) {
  const cb = body?.callback_query;
  if (!cb) return;
  const chatId = cb.message?.chat?.id;
  const data = cb.data;
  const from = cb.from;
  if (!chatId || !data || !from) return;

  const user = await getOrCreateUser(supabase, from);
  const lang: Lang = (user?.language as Lang) || "ru";

  await answerCallbackQuery(botToken, cb.id);

  if (data === "buy_premium") {
    const providerToken = Deno.env.get("TELEGRAM_PAYMENT_PROVIDER_TOKEN") ?? "";
    if (!providerToken) {
      await sendMessage(chatId, botToken, "⚠️ Платежный шлюз временно недоступен. Обратитесь в поддержку.");
      return;
    }
    await createPremiumInvoice(chatId, botToken, lang, providerToken);
    return;
  }

  // ... остальные хендлеры (jobs, docs, etc)
}

export async function processTelegramMessage(body: any, supabase: any, botToken: string) {
  const msg = body?.message;
  const preCheckout = body?.pre_checkout_query;

  // 1. Обработка Pre-Checkout (Обязательно)
  if (preCheckout) {
    await answerPreCheckoutQuery(botToken, preCheckout.id, true);
    return;
  }

  if (!msg) return;
  const chatId = msg.chat?.id;
  const from = msg.from;
  if (!chatId || !from) return;

  const user = await getOrCreateUser(supabase, from);
  const lang: Lang = (user?.language as Lang) || "ru";
  const hasPremium = await isPremiumActive(supabase, from.id);

  // 2. Успешный платеж
  if (msg.successful_payment) {
    await activatePremiumSubscription(supabase, from.id, msg.successful_payment);
    const successMsg = {
      ru: "🎉 Оплата успешно завершена!\n\nВаш **VAQTA AI Premium** активирован на 30 дней. Теперь все функции доступны без ограничений.",
      uz: "🎉 To'lov muvaffaqiyatli yakunlandi!\n\nSizning **VAQTA AI Premium** 30 kunga faollashtirildi. Barcha funktsiyalar endi cheksiz mavjud.",
    };
    await sendMessage(chatId, botToken, successMsg[lang] || successMsg.ru);
    return;
  }

  const text = msg.text;

  // 3. Меню Premium
  if (text === "/premium" || text?.includes("Premium")) {
    const premiumText = {
      ru: "⭐ **VAQTA AI Premium**\n\nПолный доступ к возможностям:\n✅ AI помощник без ограничений\n✅ Распознавание документов через Vision\n✅ Перевод документов\n✅ Проверка работодателей\n\n💰 Стоимость: **99 000 сум / 30 дней**",
      uz: "⭐ **VAQTA AI Premium**\n\nTo'liq imkoniyatlar:\n✅ Cheksiz AI yordamchi\n✅ Vision orqali hujjatlarni aniqlash\n✅ Hujjatlar tarjimasi\n✅ Ish beruvchilarni tekshirish\n\n💰 Narxi: **99 000 so'm / 30 kun**",
    };
    await sendMessage(chatId, botToken, premiumText[lang] || premiumText.ru, {
      inline_keyboard: [[{ text: "💳 Оплатить Premium", callback_data: "buy_premium" }]]
    });
    return;
  }

  // 4. Ограничение доступа для FREE пользователей (AI / Vision)
  if (!hasPremium) {
    const isAiRequest = text && !text.startsWith("/");
    const isVisionRequest = msg.photo || msg.document;

    if (isAiRequest || isVisionRequest) {
      // Здесь можно добавить счетчик лимитов. Если лимит исчерпан:
      const limitReached = true; // Заглушка, в реальности проверяем ai_usage
      if (limitReached) {
        const lockText = {
          ru: "⭐ Эта функция доступна в **VAQTA AI Premium**.\n\nКупите подписку, чтобы пользоваться AI помощником и распознаванием фото без ограничений.",
          uz: "⭐ Bu funksiya **VAQTA AI Premium**'da mavjud.\n\nAI yordamchisi va rasmlarni aniqlashdan cheksiz foydalanish uchun obunani sotib oling.",
        };
        await sendMessage(chatId, botToken, lockText[lang] || lockText.ru, {
          inline_keyboard: [[{ text: "💳 Купить Premium", callback_data: "buy_premium" }]]
        });
        return;
      }
    }
  }

  // Обычная логика (start, ai responses etc)
  if (text === "/start") {
    await sendMessage(chatId, botToken, "Главное меню", {
      keyboard: [[{ text: "⭐ VAQTA AI Premium" }], [{ text: "🤖 AI Чат" }, { text: "📷 Скан" }]],
      resize_keyboard: true
    });
    return;
  }
}