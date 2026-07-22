import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const historyRef = useRef<ChatMessage[]>([]);

  const sendMessage = useCallback(async (message: string, image?: string): Promise<string | null> => {
    setLoading(true);
    console.log("[AI] USER MESSAGE:", message);

    const userMsg: ChatMessage = { role: "user", content: message };
    const newHistory = [...historyRef.current, userMsg].slice(-20);
    historyRef.current = newHistory;
    setMessages(newHistory);

    const payload = {
      message,
      image,
      language_code: language,
      history: newHistory,
      context: {
        platform: "VAQTA Production",
        ui_language: language,
        has_image: !!image,
      },
    };

    console.log("[AI] REQUEST PAYLOAD:", payload);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: payload,
      });

      if (error) {
        console.error("[AI] Supabase edge function error:", error);
        throw error;
      }

      const reply = data?.reply || data?.message || data?.text || "Не удалось получить ответ. Попробуйте ещё раз.";
      console.log("[AI] RESPONSE SUCCESS:", reply);

      const assistantMsg: ChatMessage = { role: "assistant", content: reply };
      const updatedHistory = [...newHistory, assistantMsg].slice(-20);
      historyRef.current = updatedHistory;
      setMessages(updatedHistory);

      return reply;
    } catch (err) {
      console.error("[AI] Critical Failure:", err);
      const fallbackReply = "Не удалось получить ответ. Попробуйте ещё раз.";
      
      const assistantMsg: ChatMessage = { role: "assistant", content: fallbackReply };
      const updatedHistory = [...newHistory, assistantMsg].slice(-20);
      historyRef.current = updatedHistory;
      setMessages(updatedHistory);
      
      return fallbackReply;
    } finally {
      setLoading(false);
    }
  }, [language]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setMessages([]);
  }, []);

  return { sendMessage, loading, messages, clearHistory };
}