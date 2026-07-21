import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/theme";

interface ChatMessage {
  role: string;
  content: string;
}

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const { lang } = useApp();
  const sessionHistory = useRef<ChatMessage[]>([]);

  const sendMessage = useCallback(async (message: string): Promise<string | null> => {
    setLoading(true);
    sessionHistory.current.push({ role: "user", content: message });

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { 
          message,
          language_code: lang,
          session_history: sessionHistory.current.slice(-10)
        },
      });

      if (error) throw error;

      const reply = data?.reply || data?.message;
      if (reply) {
        sessionHistory.current.push({ role: "assistant", content: reply });
        return reply;
      }
      return null;
    } catch (err) {
      console.error("AI Chat Error:", err);
      const errorMsg = {
        ru: "Извините, произошла ошибка. Попробуйте еще раз.",
        uz: "Kechirasiz, xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
        tg: "Бубахшед, хатогӣ рух дод. Лутфан бори дигар кӯшиш кунед."
      };
      return errorMsg[lang] || errorMsg.uz;
    } finally {
      setLoading(false);
    }
  }, [lang]);

  return { sendMessage, loading };
}