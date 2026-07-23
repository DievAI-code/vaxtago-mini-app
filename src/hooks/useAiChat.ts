"use client";

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";
import { detectAIAction, AIActionResponse } from "@/services/aiActions";
import { toast } from "sonner";
import { subscriptionService } from "@/services/subscriptionService";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: AIActionResponse;
}

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatHistoryRef = useRef<ChatMessage[]>([]);

  const sendMessage = useCallback(async (message: string, image?: string): Promise<string | null> => {
    if ((!message.trim() && !image) || loading) return null;
    
    const userPhone = localStorage.getItem("vaxtago_user_phone");
    if (!userPhone) return null;

    setLoading(true);
    
    // 1. Предварительная детекция гео-запроса на фронте
    const localAction = detectAIAction(message);
    if (localAction.action !== "GENERAL_CHAT") {
        const canUseMap = await subscriptionService.canUse('map');
        if (!canUseMap) {
            toast.error(t("premium.feature_locked") || "Лимит карт исчерпан");
            setLoading(false);
            return null;
        }
        await subscriptionService.trackUsage('map');
    }

    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date()
    };
    
    const newHistory = [...chatHistoryRef.current, userMsg].slice(-10);
    setMessages(newHistory);
    chatHistoryRef.current = newHistory;

    try {
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

      if (data?.success === false && data?.error === "LIMIT_EXCEEDED") {
        toast.error(t("premium.feature_locked"));
        return null;
      }

      const replyText = data?.reply || "AI is busy.";
      
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: replyText,
        timestamp: new Date(),
        action: localAction.action !== "GENERAL_CHAT" ? localAction : undefined
      };
      
      const updatedHistory = [...newHistory, assistantMsg];
      setMessages(updatedHistory);
      chatHistoryRef.current = updatedHistory;
      
      return replyText;

    } catch (err: any) {
      toast.error(t("ai.error"));
      return null;
    } finally {
      setLoading(false);
    }
  }, [language, loading, t]);

  return { sendMessage, loading, messages };
}