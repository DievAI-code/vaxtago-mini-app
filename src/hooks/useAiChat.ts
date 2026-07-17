import { useState, useCallback, useRef } from "react";
import { useApp } from "@/lib/theme";
import { useTelegramUser } from "@/components/TelegramProvider";
import { useTelegram } from "@/hooks/useTelegram";

const AI_URL = "https://watkanjjfsvqbhebchpk.supabase.co/functions/v1/ai-assistant";

interface UseAiChatOptions {
  onError?: (msg: string) => void;
}

export function useAiChat(options?: UseAiChatOptions) {
  const { lang } = useApp();
  const { telegramId, isInTelegram } = useTelegramUser();
  const { webApp } = useTelegram();
  const [loading, setLoading] = useState(false);
  // React-session fallback history
  const sessionHistory = useRef<Array<{ role: string; content: string }>>([]);

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
        console.error("AI ERROR: offline");
        options?.onError?.(offlineMsg);
        return null;
      }

      setLoading(true);
      const device = detectDevice();

      // Track session history for fallback
      sessionHistory.current.push({ role: "user", content: message });

      const payload = {
        message,
        telegram_id: isInTelegram ? telegramId : null,
        user_id: isInTelegram ? `tg_${telegramId}` : "anonymous",
        language: lang,
        context: imageBase64 ? "vision" : "chat",
        image: imageBase64,
        has_image: !!imageBase64,
        image_url: undefined as string | undefined,
        platform: isInTelegram ? "telegram" : "web",
        device,
        init_data: window.Telegram?.WebApp?.initData ?? null,
        // Send session history as fallback if DB history missing
        session_history: sessionHistory.current.slice(-20),
      };

      console.log("AI REQUEST", payload);

      const attemptRequest = async (attempt: number): Promise<string | null> => {
        console.log(`AI ATTEMPT ${attempt}`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);

        try {
          const response = await fetch(AI_URL, {
            method: "POST",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timeout);
          console.log("AI RESPONSE STATUS", response.status);

          const data = await response.json();
          console.log("AI RESPONSE", data);

          // Display the assistant reply, not the user prompt
          if (data?.success === true && (data.reply || data.message)) {
            const reply = data.reply || data.message;
            sessionHistory.current.push({ role: "assistant", content: reply });
            return reply;
          }
          if (data?.reply || data?.message) {
            const reply = data.reply || data.message;
            sessionHistory.current.push({ role: "assistant", content: reply });
            return reply;
          }
          if (data?.success === false) {
            throw new Error(data.error || "AI returned failure");
          }
          throw new Error("Empty or invalid response: " + JSON.stringify(data));
        } catch (err: any) {
          clearTimeout(timeout);
          console.error("AI ERROR", err?.message || err);
          if (attempt < 3) {
            console.log(`AI RETRY ${attempt + 1}...`);
            return attemptRequest(attempt + 1);
          }
          options?.onError?.("Не удалось связаться с AI. Попробуйте ещё раз.");
          return null;
        }
      };

      try {
        const reply = await attemptRequest(1);
        if (reply) return reply;
        options?.onError?.("Связь слабая. Повторите запрос.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [lang, telegramId, isInTelegram, options],
  );

  return { sendMessage, loading };
}