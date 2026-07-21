import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/theme";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const { lang } = useApp();
  // Память на 20 сообщений
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const historyRef = useRef<ChatMessage[]>([]);

  const sendMessage = useCallback(async (message: string, image?: string): Promise<string | null> => {
    setLoading(true);
    const userMsg: ChatMessage = { role: "user", content: message };
    
    // Обновляем локальную историю (макс 20 сообщений)
    const newHistory = [...historyRef.current, userMsg].slice(-20);
    historyRef.current = newHistory;
    setMessages(newHistory);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { 
          message,
          image,
          language_code: lang, 
          history: newHistory,
          context: {
            platform: "VAQTA Web",
            last_action: image ? "vision_scan" : "chat"
          }
        },
      });

      if (error) throw error;

      const reply = data?.reply || data?.message || "AI Connection Error";
      const assistantMsg: ChatMessage = { role: "assistant", content: reply };
      
      const updatedHistory = [...newHistory, assistantMsg].slice(-20);
      historyRef.current = updatedHistory;
      setMessages(updatedHistory);
      
      return reply;
    } catch (err) {
      console.error("VAQTA AI Chat Error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setMessages([]);
  }, []);

  return { sendMessage, loading, messages, clearHistory };
}