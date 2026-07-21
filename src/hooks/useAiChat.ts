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
    
    // Поддержка памяти на 20 сообщений
    const newHistory = [...historyRef.current, userMsg].slice(-20);
    historyRef.current = newHistory;
    setMessages(newHistory);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { 
          message,
          image,
          language_code: language, 
          history: newHistory,
          // Передаем контекст для умных команд 'переведи/объясни'
          context: {
            platform: "VAQTA Production",
            ui_language: language,
            has_image: !!image
          }
        },
      });

      if (error) throw error;

      const reply = data?.reply || data?.message || "AI Error";
      const assistantMsg: ChatMessage = { role: "assistant", content: reply };
      
      const updatedHistory = [...newHistory, assistantMsg].slice(-20);
      historyRef.current = updatedHistory;
      setMessages(updatedHistory);
      
      return reply;
    } catch (err) {
      console.error("VAQTA AI Production Error:", err);
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