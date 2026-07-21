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
  const history = useRef<ChatMessage[]>([]);

  const sendMessage = useCallback(async (message: string, image?: string): Promise<string | null> => {
    setLoading(true);
    const userMsg: ChatMessage = { role: "user", content: message };
    history.current.push(userMsg);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { 
          message,
          image,
          language_code: lang,
          history: history.current.slice(-10)
        },
      });

      if (error) throw error;

      const reply = data?.reply || data?.message || "AI Error";
      history.current.push({ role: "assistant", content: reply });
      return reply;
    } catch (err) {
      console.error("VAQTA AI Chat Error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lang]);

  return { sendMessage, loading, history: history.current };
}