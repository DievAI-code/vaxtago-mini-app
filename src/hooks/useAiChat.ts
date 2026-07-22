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
    
    const userMsg: ChatMessage = { role: "user", content: message };
    const newHistory = [...historyRef.current, userMsg].slice(-20);
    historyRef.current = newHistory;
    setMessages(newHistory);

    try {
      // Set a 30s timeout for the edge function call
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message,
          image,
          language_code: language,
          history: newHistory,
        },
      });

      if (error) {
        console.error("[AI Assistant Error]:", error);
        let errorMsg = "AI помощник временно недоступен. Попробуйте еще раз через минуту.";
        
        if (error.status === 404) errorMsg = "Сервис AI не найден. Обратитесь в поддержку.";
        if (error.status === 504 || error.message?.includes("timeout")) errorMsg = "AI слишком долго думал. Попробуйте сократить запрос.";
        
        throw new Error(errorMsg);
      }

      const reply = data?.reply || data?.message || "AI не прислал текст ответа.";
      const assistantMsg: ChatMessage = { role: "assistant", content: reply };
      const updatedHistory = [...newHistory, assistantMsg].slice(-20);
      historyRef.current = updatedHistory;
      setMessages(updatedHistory);

      return reply;
    } catch (err: any) {
      const fallbackReply = err.message || "Не удалось получить ответ. Попробуйте ещё раз.";
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