import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  role: string;
  content: string;
}

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const sessionHistory = useRef<ChatMessage[]>([]);

  const sendMessage = useCallback(async (message: string): Promise<string | null> => {
    setLoading(true);
    sessionHistory.current.push({ role: "user", content: message });

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { 
          message,
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
      return "Kechirasiz, xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.";
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendMessage, loading };
}