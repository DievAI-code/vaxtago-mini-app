import { useState, useCallback } from "react";
import { useApp } from "@/lib/theme";
import { useTelegramUser } from "@/components/TelegramProvider";

const AI_URL = "https://watkanjjfsvqbhebchpk.supabase.co/functions/v1/ai-assistant";

interface UseAiChatOptions {
  onError?: (msg: string) => void;
}

export function useAiChat(options?: UseAiChatOptions) {
  const { lang } = useApp();
  const { telegramId, isInTelegram } = useTelegramUser();
  const [loading, setLoading] = useState(false);

  const detectDevice = () => {
    const ua = navigator.userAgent || "";
    if (/Android/i.test(ua)) return "android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    return "web";
  };

  const sendMessage = useCallback(
    async (message: string, imageBase64?: string): Promise<string | null> => {
      if (!navigator.onLine) {
        const offlineMsg = "Проверьте интернет соединение";
        options?.onError?.(offlineMsg);
        return null;
      }

      setLoading(true);
      const device = detectDevice();
      console.log("DEVICE:", device.toUpperCase());
      console.log("AI SEND START", message);
      console.log("AI URL", AI_URL);

      const payload = {
        message,
        telegram_id: isInTelegram ? telegramId : null,
        language: lang,
        context: imageBase64 ? "vision" : "chat",
        image: imageBase64,
        platform: "telegram",
        device,
      };

      const attemptRequest = async (attempt: number): Promise<string | null> => {
        console.log(`AI ATTEMPT ${attempt}:`, JSON.stringify(payload));
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        try {
          const response = await fetch(AI_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timeout);
          console.log("AI RESPONSE STATUS", response.status);

          const data = await response.json();
          console.log("AI RESPONSE DATA", JSON.stringify(data));

          if (data?.success === true && data.reply) {
            console.log("ADDING AI MESSAGE", data.reply);
            return data.reply;
          }
          if (data?.reply) {
            console.log("ADDING AI MESSAGE", data.reply);
            return data.reply;
          }
          throw new Error("Empty or invalid response: " + JSON.stringify(data));
        } catch (err: any) {
          clearTimeout(timeout);
          console.error("AI ERROR:", err?.message || err);
          if (attempt < 3) {
            console.log(`AI RETRY ${attempt + 1}...`);
            return attemptRequest(attempt + 1);
          }
          options?.onError?.("Ошибка: " + (err?.message || "неизвестно"));
          return null;
        }
      };

      try {
        const reply = await attemptRequest(1);
        if (reply) return reply;
        options?.onError?.("Связь слабая. Повторяем запрос...");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [lang, telegramId, isInTelegram, options],
  );

  return { sendMessage, loading };
}