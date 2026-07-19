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
  const [loading, setLoading] = useState(false);
  const sessionHistory = useRef<Array<{ role: string; content: string }>>([]);

  const sendMessage = useCallback(
    async (message: string, imageBase64?: string): Promise<string | null> => {
      if (!navigator.onLine) {
        options?.onError?.("Проверьте интернет соединение");
        return null;
      }

      setLoading(true);
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
        init_data: window.Telegram?.WebApp?.initData ?? null,
        session_history: sessionHistory.current.slice(-20),
      };

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const response = await fetch(AI_URL, {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await response.json();
        if (data?.reply || data?.message) {
          const reply = data.reply || data.message;
          sessionHistory.current.push({ role: "assistant", content: reply });
          return reply;
        }
        options?.onError?.("Не удалось связаться с AI. Попробуйте ещё раз.");
        return null;
      } catch (err) {
        options?.onError?.("Ошибка связи с AI.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [lang, telegramId, isInTelegram, options],
  );

  return { sendMessage, loading };
}
