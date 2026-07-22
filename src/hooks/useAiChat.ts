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
    if (!message.trim() && !image) return null;
    
    setLoading(true);
    const userMsg: ChatMessage = { role: "user", content: message };
    const newHistory = [...historyRef.current, userMsg].slice(-10);
    setMessages(newHistory);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message,
          image,
          language_code: language, // Передаем код языка в AI
          history: newHistory,
        },
      });

      if (error) throw error;
      
      const reply = data?.reply || data?.message || "Error processing request.";
      const assistantMsg: ChatMessage = { role: "assistant", content: reply };
      
      const updatedHistory = [...newHistory, assistantMsg];
      historyRef.current = updatedHistory;
      setMessages(updatedHistory);
      return reply;

    } catch (err) {
      console.error("AI Error:", err);
      const errorMsg: ChatMessage = { role: "assistant", content: "AI xizmati vaqtincha ishlamayapti." };
      setMessages(prev => [...prev, errorMsg]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [language]);

  return { sendMessage, loading, messages };
}