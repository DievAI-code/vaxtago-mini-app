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
    console.log("USER MESSAGE", message);

    const userMsg: ChatMessage = { role: "user", content: message };
    const newHistory = [...historyRef.current, userMsg].slice(-10);
    historyRef.current = newHistory;
    setMessages(newHistory);

    const payload = {
      message,
      image,
      language_code: language,
      history: newHistory,
    };

    console.log("AI REQUEST", payload);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: payload,
      });

      if (error) {
        console.error("AI RESPONSE ERROR", error);
        throw error;
      }

      console.log("AI RESPONSE SUCCESS", data);
      
      const reply = data?.reply || data?.message || "Извините, я не смог подготовить ответ.";
      const assistantMsg: ChatMessage = { role: "assistant", content: reply };
      
      const updatedHistory = [...newHistory, assistantMsg];
      historyRef.current = updatedHistory;
      setMessages(updatedHistory);

      return reply;
    } catch (err: any) {
      console.error("AI Assistant Failure", err);
      
      let errorText = "AI помощник временно недоступен. Попробуйте еще раз через минуту.";
      if (err.message?.includes("Failed to fetch")) {
        errorText = "Ошибка сети. Проверьте подключение или настройки Supabase.";
      }

      const assistantMsg: ChatMessage = { role: "assistant", content: errorText };
      setMessages(prev => [...prev, assistantMsg]);
      return null;
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