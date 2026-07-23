"use client";

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { detectAIAction } from "@/services/aiActions";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: any;
}

/**
 * Очищает ответы AI от некорректных рекомендаций сторонних карт
 */
function sanitizeAiResponse(text: string): string {
  if (!text) return "";
  return text
    .replace(/я не могу показать карт[ыу]/gi, "Открываю встроенную карту VAQTA AI")
    .replace(/воспользоваться google maps/gi, "использовать навигатор VAQTA AI")
    .replace(/воспользуйтесь яндекс\.карти|яндекс\.картами|google maps/gi, "картой VAQTA AI");
}

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatHistoryRef = useRef<ChatMessage[]>([]);
  const navigate = useNavigate();

  const sendMessage = useCallback(async (message: string, image?: string): Promise<string | null> => {
    if ((!message.trim() && !image) || loading) return null;
    
    const userPhone = localStorage.getItem("vaxtago_user_phone");
    if (!userPhone) return null;

    setLoading(true);
    
    // Предварительная проверка намерений (локации, маршруты, работы)
    const detectedAction = detectAIAction(message);

    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date()
    };
    
    const newHistory = [...chatHistoryRef.current, userMsg].slice(-10);
    setMessages(newHistory);
    chatHistoryRef.current = newHistory;

    try {
      // 1. Поиск мест и локаций
      if (detectedAction.action === "MAP_SEARCH" || detectedAction.action === "MAP_ROUTE" || detectedAction.action === "MAP_NEARBY") {
        const replyText = detectedAction.message || "Ищу местоположение на встроенной карте VAQTA AI...";

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: replyText,
          timestamp: new Date(),
          action: detectedAction
        };

        const updatedHistory = [...newHistory, assistantMsg];
        setMessages(updatedHistory);
        chatHistoryRef.current = updatedHistory;

        setLoading(false);
        return replyText;
      }

      // 2. Детекция вакансий
      if (detectedAction.action === "JOB_SEARCH") {
        const waitingReply = "Формирую подборку вакансий...";
        
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: waitingReply,
          timestamp: new Date(),
          action: detectedAction
        };
        
        const updatedHistory = [...newHistory, assistantMsg];
        setMessages(updatedHistory);
        chatHistoryRef.current = updatedHistory;
        
        setTimeout(() => navigate(`/jobs-test?query=${encodeURIComponent(detectedAction.profession || "")}`), 1200);
        
        setLoading(false);
        return waitingReply;
      }

      // 3. Стандартный запрос к AI Edge Function
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

      const rawReply = data?.reply || "AI откликнулся.";
      const cleanReply = sanitizeAiResponse(rawReply);
      
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: cleanReply,
        timestamp: new Date()
      };
      
      const updatedHistory = [...newHistory, assistantMsg];
      setMessages(updatedHistory);
      chatHistoryRef.current = updatedHistory;
      
      return cleanReply;

    } catch (err: any) {
      toast.error(t("ai.error"));
      return null;
    } finally {
      setLoading(false);
    }
  }, [language, loading, t, navigate]);

  return { sendMessage, loading, messages };
}