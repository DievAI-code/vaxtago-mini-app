/// <reference path="../deno-env.d.ts" />
import type { Lang } from "./types.ts";
import { t } from "./translations.ts";
import { getOrCreateUser, setLanguage } from "./user.ts";
import { sendMessage, answerCallbackQuery } from "./telegram.ts";
import { createInvoice, processSuccessfulPayment } from "./telegram-payment.ts";

const LANG_CALLBACK_MAP: Record<string, string> = {
  "lang_ru": "ru",
  "lang_uz": "uz",
  "lang_tg": "tg",
  "lang_ky": "ky",
  "lang_en": "en",
};

const MINI_APP_URL = Deno.env.get("MINI_APP_URL") ?? "https://vaxtago.app/mini/home";

export async function processCallbackQuery(body: any, supabase: any, botToken: string) {
  try {
    const cb = body?.callback_query;
    if (!cb) return;
    const chatId = cb.message?.chat?.id;
    const data = cb.data;
    const from = cb.from;
    if (!chatId || !data || !from) return;

    const userId = from.id;
    const user = await getOrCreateUser(supabase, from);
    let lang: Lang = (user?.language as Lang) || "ru";
    if (!["ru", "uz", "tg", "ky", "en"].includes(lang)) lang = "ru";

    await answerCallbackQuery(botToken, cb.id);

    if (data in LANG_CALLBACK_MAP) {
      const selectedLang = LANG_CALLBACK_MAP[data];
      await setLanguage(supabase, userId, selectedLang);
      await sendMessage(chatId, botToken, t("settings_saved", selectedLang) + "\n\n" + t("welcome_commercial", selectedLang), {
        inline_keyboard: [[{ text: "🚀 Открыть VaxtaGo", web_app: { url: MINI_APP_URL } }]],
      });
      return;
    }

    if (data === "open_mini") {
      await sendMessage(chatId, botToken, "🚀 Открываю VaxtaGo...", {
        inline_keyboard: [[{ text: "🚀 Открыть VaxtaGo", web_app: { url: MINI_APP_URL } }]],
      });
      return;
    }

    if (data === "premium:buy") {
      const providerToken = Deno.env.get("TELEGRAM_PAYMENT_PROVIDER_TOKEN") ?? "";
      if (!providerToken) {
        await sendMessage(chatId, botToken, "⚠️ Платёж временно недоступен. Попробуйте позже.", {
          inline_keyboard: [[{ text: "🚀 Открыть VaxtaGo", web_app: { url: MINI_APP_URL } }]],
        });
        return;
      }
      await createInvoice(chatId, botToken, lang, providerToken);
      return;
    }
  } catch (error) {
    console.error("🔥 Callback error:", error);
  }
}

export async function processTelegramMessage(body: any, supabase: any, botToken: string) {
  const startTime = Date.now();
  try {
    const msg = body?.message;
    if (!msg) return;
    const chatId = msg.chat?.id;
    const text = msg.text?.trim();
    const from = msg.from;
    if (!chatId || !from) return;

    console.log("AI ROUTER START");
    console.log("INPUT TYPE:", text ? "text" : "unknown");

    const userId = from.id;
    const user = await getOrCreateUser(supabase, from);
    let lang: Lang = (user?.language as Lang) || "ru";
    if (!["ru", "uz", "tg", "ky", "en"].includes(lang)) lang = "ru";

    console.log({ telegram_id: userId, user_found: !!user });

    if (msg.successful_payment) {
      await processSuccessfulPayment(supabase, userId, msg.successful_payment);
      await sendMessage(chatId, botToken, "✅ Оплата прошла успешно! VaxtaGo Premium активирован.", {
        inline_keyboard: [[{ text: "🚀 Открыть VaxtaGo", web_app: { url: MINI_APP_URL } }]],
      });
      return;
    }

    if (text === "/start") {
      console.log("START COMMAND RECEIVED");
      await sendMessage(chatId, botToken,
        "👋 Добро пожаловать в VaxtaGo\n\nВаш AI помощник по работе, документам и переводам.\n\nОснователь проекта:\nДмитрий Диев",
        {
          inline_keyboard: [
            [{ text: "🇷🇺 Русский", callback_data: "lang_ru" }],
            [{ text: "🇺🇿 O'zbekcha", callback_data: "lang_uz" }],
            [{ text: "🇹🇯 Тоҷикӣ", callback_data: "lang_tg" }],
            [{ text: "🇰🇬 Кыргызча", callback_data: "lang_ky" }],
            [{ text: "🇬🇧 English", callback_data: "lang_en" }],
          ],
        }
      );
      return;
    }

    // Default: open Mini App
    await sendMessage(chatId, botToken, "🚀 Открыть VaxtaGo Mini App:", {
      inline_keyboard: [[{ text: "🚀 Открыть VaxtaGo", web_app: { url: MINI_APP_URL } }]],
    });
  } catch (error) {
    console.error("🔥 Critical Background Error:", error);
  } finally {
    console.log("AI ROUTER COMPLETE");
    console.log(`--- MESSAGE PROCESS END (${Date.now() - startTime}ms) ---`);
  }
}