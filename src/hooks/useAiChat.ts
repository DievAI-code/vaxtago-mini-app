"use client";

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: any;
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
    
    // Детекция намерения поиска работы
    const lowerMsg = message.toLowerCase();
    const isJobSearch = /работа|вакансия|ищу|сварщик|водитель|разнорабочий|нужна|job|vacancy|трудоустройство/i.test(lowerMsg);
    
    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date()
    };
    
    const newHistory = [...chatHistoryRef.current, userMsg].slice(-10);
    setMessages(newHistory);
    chatHistoryRef.current = newHistory;

    try {
      // Если пользователь ищет работу — показываем сообщение о скором запуске
      if (isJobSearch) {
        const waitingReply = "Мы уже готовим AI-поиск вакансий. Скоро вы сможете искать реальные вакансии через официальные источники.";
        
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: waitingReply,
          timestamp: new Date(),
          action: { type: "JOB_SEARCH_WAITING" }
        };
        
        const updatedHistory = [...newHistory, assistantMsg];
        setMessages(updatedHistory);
        chatHistoryRef.current = updatedHistory;
        
        // Переходим на страницу вакансий через 1.5 секунды
        setTimeout(() => navigate("/jobs"), 1500);
        
        setLoading(false);
        return waitingReply;
      }

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
        timestamp: new Date()
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
  }, [language, loading, t, navigate]);

  return { sendMessage, loading, messages };
}