"use client";

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";
import { detectIntent, executeAIAction, AIActionResponse } from "@/services/aiActions";
import { mapsService } from "@/services/maps";

interface ChatMessage {
  role: "user" | "assistant" | "action";
  content: string;
  timestamp: Date;
  action?: AIActionResponse;
}

interface AiChatOptions {
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
  onAction?: (action: AIActionResponse) => void;
}

export function useAiChat(options: AiChatOptions = {}) {
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatHistoryRef = useRef<ChatMessage[]>([]);

  const sendMessage = useCallback(async (message: string, image?: string): Promise<string | null> => {
    if ((!message.trim() && !image) || loading) return null;
    
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
      // Определяем намерение пользователя
      const intent = detectIntent(message);
      
      // Если это действие с картой или другое действие - выполняем
      if (intent.action !== "GENERAL_CHAT") {
        const actionResult = await executeAIAction(intent);
        
        const actionMsg: ChatMessage = {
          role: "action",
          content: actionResult.message || "Выполняю действие",
          timestamp: new Date(),
          action: intent
        };
        
        const updatedHistory = [...newHistory, actionMsg];
        setMessages(updatedHistory);
        chatHistoryRef.current = updatedHistory;
        
        options.onAction?.(intent);
        return actionResult.message || "Действие выполнено";
      }
      
      // Стандартный AI запрос
      const detectedLang = detectLanguageFromText(message);
      const targetLang = detectedLang || language;

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message: message.trim(),
          image,
          language_code: targetLang,
          history: newHistory.map(m => ({
            role: m.role,
            content: m.content
          })),
          has_image: !!image,
          context: {
            user_language: language,
            detected_language: detectedLang,
            timestamp: new Date().toISOString()
          }
        },
      });

      if (error) {
        console.error("AI Error:", error);
        options.onError?.(error.message);
        
        const fallbackResponse = getFallbackResponse(message, language);
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: fallbackResponse,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMsg]);
        chatHistoryRef.current = [...newHistory, assistantMsg];
        return fallbackResponse;
      }
      
      const reply = data?.reply || data?.message || getFallbackResponse(message, language);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: reply,
        timestamp: new Date()
      };
      
      const updatedHistory = [...newHistory, assistantMsg];
      setMessages(updatedHistory);
      chatHistoryRef.current = updatedHistory;
      
      options.onSuccess?.(reply);
      return reply;

    } catch (err: any) {
      console.error("AI Request Failed:", err);
      const errorMsg = getFallbackResponse(message, language);
      
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: errorMsg,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      chatHistoryRef.current = [...chatHistoryRef.current, assistantMsg];
      
      options.onError?.(err.message);
      return errorMsg;
    } finally {
      setLoading(false);
    }
  }, [language, loading, options]);

  const detectLanguageFromText = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (/[а-яё]/i.test(text)) return "ru";
    if (/[ўғқҳәөү]/i.test(text)) return "uz";
    if (/[ӣӯҷҳҒҚ]/i.test(text)) return "tg";
    if (/[өүҡң]/i.test(text)) return "ky";
    if (/[a-z]/i.test(text)) return "en";
    
    return language;
  };

  const getFallbackResponse = (message: string, lang: string): string => {
    const responses: Record<string, string> = {
      ru: "Извините, AI временно недоступен. Пожалуйста, попробуйте позже.",
      uz: "Kechirasiz, AI vaqtincha ishlamayapti. Iltimos, keyinroq urinib ko'ring.",
      en: "Sorry, AI is temporarily unavailable. Please try again later.",
      tg: "Бубахшед, AI вақтан дастнорас аст. Лутфан баъдтар кӯшиш кунед.",
      ky: "Кечиресиз, AI убактылуу жеткиликсиз. Сураныч, кийинчерээк аракет кылыңыз."
    };
    
    return responses[lang] || responses.ru;
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    chatHistoryRef.current = [];
  }, []);

  return {
    sendMessage,
    loading,
    messages,
    clearChat,
    chatHistory: chatHistoryRef.current
  };
}