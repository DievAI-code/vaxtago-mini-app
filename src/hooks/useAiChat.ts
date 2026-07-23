"use client";

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";
import { detectIntent, executeAIAction, detectLanguage, AIActionResponse } from "@/services/aiActions";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant" | "action";
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
    if (!userPhone) {
      toast.error("Please login first");
      return null;
    }

    setLoading(true);
    
    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date()
    };
    
    const newHistory = [...chatHistoryRef.current, userMsg].slice(-10);
    setMessages(newHistory);
    chatHistoryRef.current = newHistory;

    try {
      const detectedLang = detectLanguage(message) || language;
      const intent = detectIntent(message);
      
      // Если это простое действие с картой (локальное)
      if (intent.action === "MAP_SEARCH" || intent.action === "BUILD_ROUTE") {
        // Мы не прерываем, а даем AI обработать, но можем добавить пометку
        console.log("Intent detected:", intent.action);
      }

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message: message.trim(),
          image,
          language_code: detectedLang,
          user_phone: userPhone,
          history: newHistory.map(m => ({
            role: m.role,
            content: m.content
          }))
        },
      });

      if (error) throw error;

      if (data?.success === false && data?.error === "LIMIT_EXCEEDED") {
        toast.error(t("premium.feature_locked"));
        const limitMsg: ChatMessage = {
          role: "assistant",
          content: t("premium.feature_locked") + " (10/10 AI Daily Limit)",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, limitMsg]);
        return null;
      }

      if (data?.reply) {
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.reply,
          timestamp: new Date()
        };
        
        const updatedHistory = [...newHistory, assistantMsg];
        setMessages(updatedHistory);
        chatHistoryRef.current = updatedHistory;
        return data.reply;
      }

      throw new Error("Empty response from AI");

    } catch (err: any) {
      console.error("AI Request Failed:", err);
      toast.error(t("ai.error"));
      
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: t("ai.error") || "AI is temporarily unavailable.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMsg]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [language, loading, t]);

  const clearChat = useCallback(() => {
    setMessages([]);
    chatHistoryRef.current = [];
  }, []);

  return {
    sendMessage,
    loading,
    messages,
    clearChat,
  };
}