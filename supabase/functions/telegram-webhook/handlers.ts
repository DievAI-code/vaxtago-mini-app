/// <reference path="../deno-env.d.ts" />
import type { Lang } from "./types.ts";
import { t } from "./translations.ts";
import { getOrCreateUser, setLanguage } from "./user.ts";
import { sendMessage, answerCallbackQuery } from "./telegram.ts";
import { createInvoice, processSuccessfulPayment } from "./telegram-payment.ts";
import { getAIResponse } from "./ai.ts";
import { analyzeDocument } from "./vision.ts";

const LANG_CALLBACK_MAP: Record<string, string> = {
  "lang_ru": "ru", "lang_uz": "uz", "lang_tg": "tg", "lang_ky": "ky", "lang_en": "en",
};

const MINI_APP_URL = Deno.env.get("MINI_APP_URL") ?? "https://vaxtago.vercel.app/mini/home";

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
      await setLanguage(supabase, userId, LANG_CALLBACK_MAP[data]);
      await sendMessage(chatId, botToken,
        `✅ Язык сохранён: ${LANG_CALLBACK_MAP[data]}\n\n🤖 AI Помощник VaxtaGo готов помочь!`,
        {
          inline_keyboard: [
            [{ text: "💬 Спросить AI", callback_data: "ask_ai" }],
            [
              { text: "📷 Фото / документ", callback_data: "photo" },
              { text: "💼 Работа", callback_data: "jobs" },
            ],
            [
              { text: "📄 Документы", callback_data: "docs" },
              { text: "🌐 Перевод", callback_data: "translate" },
            ],
            [{ text: "🛡 Проверка работодателя", callback_data: "employer" }],
          ],
        }
      );
      return;
    }

    if (data === "ask_ai") {
      await sendMessage(chatId, botToken, "💬 Напишите ваш вопрос — я отвечу сразу.");
      return;
    }

    if (data === "photo") {
      await sendMessage(chatId, botToken, "📷 Отправьте фото или документ — я распознаю текст.");
      return;
    }

    if (data === "jobs") {
      await sendMessage(chatId, botToken, "💼 Напишите профессию или город для поиска работы.");
      return;
    }

    if (data === "docs") {
      await sendMessage(chatId, botToken, "📄 Отправьте документ — я проверю и объясню.");
      return;
    }

    if (data === "translate") {
      await sendMessage(chatId, botToken, "🌐 Отправьте текст для перевода.");
      return;
    }

    if (data === "employer") {
      await sendMessage(chatId, botToken, "🛡 Отправьте ИНН или название компании.");
      return;
    }

    if (data.startsWith("ocr_translate_menu:")) {
      const fileId = data.split(":").slice(1).join(":");
      await sendMessage(chatId, botToken, "Выберите язык:", {
        inline_keyboard: [
          [{ text: "🇺🇿 Узбекский", callback_data: `ocr_translate:uz:${fileId}` }],
          [{ text: "🇷🇺 Русский", callback_data: `ocr_translate:ru:${fileId}` }],
          [{ text: "🇹🇯 Таджикский", callback_data: `ocr_translate:tg:${fileId}` }],
          [{ text: "🇰🇬 Кыргызский", callback_data: `ocr_translate:ky:${fileId}` }],
          [{ text: "🇬🇧 Английский", callback_data: `ocr_translate:en:${fileId}` }],
        ],
      });
      return;
    }

    if (data.startsWith("ocr_translate:")) {
      const parts = data.split(":");
      const target = parts[1];
      const fileId = parts.slice(2).join(":");
      try {
        const { result } = await analyzeDocument(botToken, fileId, "Распознай текст", lang, userId);
        const translated = await getAIResponse(`Переведи на ${target}: ${result}`, lang, userId);
        await sendMessage(chatId, botToken, `🌐 Перевод:\n\n${translated}`);
      } catch {
        await sendMessage(chatId, botToken, "⚠️ Не удалось перевести.");
      }
      return;
    }

    if (data.startsWith("ocr_explain:")) {
      const fileId = data.split(":").slice(1).join(":");
      try {
        const { result } = await analyzeDocument(botToken, fileId, "Распознай текст", lang, userId);
        const explained = await getAIResponse(`Объясни простыми словами: ${result}`, lang, userId);
        await sendMessage(chatId, botToken, `📝 Объяснение:\n\n${explained}`);
      } catch {
        await sendMessage(chatId, botToken, "⚠️ Не удалось объяснить.");
      }
      return;
    }

    if (data.startsWith("ocr_send_ai:")) {
      const fileId = data.split(":").slice(1).join(":");
      try {
        const { result } = await analyzeDocument(botToken, fileId, "Распознай текст", lang, userId);
        const reply = await getAIResponse(result, lang, userId);
        await sendMessage(chatId, botToken, reply);
      } catch {
        await sendMessage(chatId, botToken, "⚠️ Не удалось обработать.");
      }
      return;
    }

    if (data === "ocr_save") {
      await sendMessage(chatId, botToken, "✅ Текст сохранён в вашем профиле.");
      return;
    }

    if (data === "premium:buy") {
      const providerToken = Deno.env.get("TELEGRAM_PAYMENT_PROVIDER_TOKEN") ?? "";
      if (!providerToken) {
        await sendMessage(chatId, botToken, "⚠️ Платёж временно недоступен.", {
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

    const userId = from.id;
    const user = await getOrCreateUser(supabase, from);
    let lang: Lang = (user?.language as Lang) || "ru";
    if (!["ru", "uz", "tg", "ky", "en"].includes(lang)) lang = "ru";

    if (msg.successful_payment) {
      await processSuccessfulPayment(supabase, userId, msg.successful_payment);
      await sendMessage(chatId, botToken, "✅ Оплата прошла успешно! VaxtaGo Premium активирован.", {
        inline_keyboard: [[{ text: "🚀 Открыть VaxtaGo", web_app: { url: MINI_APP_URL } }]],
      });
      return;
    }

    if (msg.photo || msg.document) {
      await sendMessage(chatId, botToken, "📷 Анализирую изображение...");
      const fileId = msg.photo ? msg.photo[msg.photo.length - 1].file_id : msg.document.file_id;
      try {
        const { result } = await analyzeDocument(botToken, fileId, "Распознай текст", lang, userId);
        await sendMessage(chatId, botToken, `✅ Текст распознан:\n\n${result}\n\nЧто сделать?`, {
          inline_keyboard: [
            [
              { text: "🔹 Перевести", callback_data: `ocr_translate_menu:${fileId}` },
              { text: "🔹 Объяснить", callback_data: `ocr_explain:${fileId}` },
            ],
            [
              { text: "🔹 Сохранить", callback_data: "ocr_save" },
              { text: "🔹 Отправить AI", callback_data: `ocr_send_ai:${fileId}` },
            ],
          ],
        });
      } catch (e) {
        await sendMessage(chatId, botToken, "⚠️ Не удалось распознать изображение.");
      }
      return;
    }

    if (text === "/start") {
      await sendMessage(chatId, botToken,
        "👋 Добро пожаловать в VaxtaGo\n\nОснователь:\nДиев Дмитрий Сергеевич\n\nВыберите язык:",
        {
          inline_keyboard: [
            [{ text: "🇷🇺 Русский", callback_data: "lang_ru" }],
            [{ text: "🇺🇿 O'zbek", callback_data: "lang_uz" }],
            [{ text: "🇹🇯 Тоҷикӣ", callback_data: "lang_tg" }],
            [{ text: "🇰🇬 Кыргызча", callback_data: "lang_ky" }],
            [{ text: "🇬🇧 English", callback_data: "lang_en" }],
          ],
        }
      );
      return;
    }

    if (text) {
      const reply = await getAIResponse(text, lang, userId);
      await sendMessage(chatId, botToken, reply);
      return;
    }

    await sendMessage(chatId, botToken, "🚀 Открыть VaxtaGo Mini App:", {
      inline_keyboard: [[{ text: "🚀 Открыть VaxtaGo", web_app: { url: MINI_APP_URL } }]],
    });
  } catch (error) {
    console.error("🔥 Critical Background Error:", error);
  } finally {
    console.log(`--- MESSAGE PROCESS END (${Date.now() - startTime}ms) ---`);
  }
}
