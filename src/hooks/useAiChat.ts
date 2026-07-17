import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/theme";
import { useTelegramUser } from "@/components/TelegramProvider";

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
      const startTime = Date.now();
      console.log("DEVICE:", device.toUpperCase());
      console.log("AI REQUEST TIME:", new Date().toISOString());

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
          const { data, error } = await supabase.functions.invoke("ai-assistant", {
            body: payload,
            signal: controller.signal as any,
          });
          clearTimeout(timeout);
          console.log("AI STATUS:", error ? "ERROR" : "OK");
          console.log("AI DATA:", JSON.stringify(data));

          if (data?.success === true && data.reply) {
            return data.reply;
          }
          if (error) {
            throw new Error(error.message);
          }
          if (data?.reply) return data.reply;
          throw new Error("Empty response");
        } catch (err: any) {
          clearTimeout(timeout);
          console.error("AI ERROR:", err?.message || err);
          if (attempt < 3) {
            console.log(`AI RETRY ${attempt + 1}...`);
            return attemptRequest(attempt + 1);
          }
          return null;
        }
      };

      try {
        const reply = await attemptRequest(1);
        const duration = Date.now() - startTime;
        console.log("AI DONE in", duration, "ms");
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