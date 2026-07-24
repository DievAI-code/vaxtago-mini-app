"use client";

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { detectAIAction, ActionChip, AIActionType } from "@/services/aiActions";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: any;
  chips?: ActionChip[];
}

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatHistoryRef = useRef<ChatMessage[]>([]);
  const navigate = useNavigate();

  const sendMessage = useCallback(async (message: string, image?: string): Promise<string | null> => {
    if ((!message.trim() && !image) || loading) return null;
    
    const userPhone = localStorage.getItem("vaxtago_user_phone") || "79000000000";

    setLoading(true);

    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date()
    };
    
    const newHistory = [...chatHistoryRef.current, userMsg].slice(-10);
    setMessages(newHistory);
    chatHistoryRef.current = newHistory;

    // Local intent parsing for immediate UI actions
    const detected = detectAIAction(message);

    try {
      // 1. Direct navigation triggers
      if (detected.type === "translate_photo") {
        setTimeout(() => navigate("/scanner"), 800);
      } else if (detected.type === "map_search" && detected.query) {
        setTimeout(() => navigate(`/maps?search=${encodeURIComponent(detected.query!)}`), 800);
      } else if (detected.type === "job_search" && detected.query) {
        setTimeout(() => navigate(`/jobs-test?query=${encodeURIComponent(detected.query!)}`), 800);
      }

      // 2. AI request for text response
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message: message.trim(),
          image,
          language_code: language,
          user_phone: userPhone,
          history: newHistory.map(m => ({ role: m.role, content: m.content }))
        },
      });

      if (error) throw error;

      const replyText = data?.reply || "AI жавоби олинмади.";
      
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: replyText,
        timestamp: new Date(),
        action: detected.type !== "chat" ? detected : undefined
      };
      
      const updatedHistory = [...newHistory, assistantMsg];
      setMessages(updatedHistory);
      chatHistoryRef.current = updatedHistory;
      
      return replyText;

    } catch (err: any) {
      toast.error(t("ai.error") || "Алоқада хатолик юз берди");
      return null;
    } finally {
      setLoading(false);
    }
  }, [language, loading, t, navigate]);

  return { sendMessage, loading, messages };
}