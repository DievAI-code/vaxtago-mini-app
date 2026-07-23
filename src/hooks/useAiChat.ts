"use client";

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";
import { detectIntent, executeAIAction, detectLanguage, AIActionResponse } from "@/services/aiActions";

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
      // Определяем автоязык и интент
      const detectedLang = detectLanguage(message) || language;
      const intent = detectIntent(message);
      
      // Если это действие с картой или другое специфическое действие
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
      
      // Вызов Supabase Edge Function AI
      if (supabase) {
        const { data, error } = await supabase.functions.invoke("ai-assistant", {
          body: {
            message: message.trim(),
            image,
            language_code: detectedLang,
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

        if (!error && (data?.reply || data?.message)) {
          const reply = data.reply || data.message;
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
        }
      }

      // Fallback ответ на языке сообщения
      const fallbackResponse = getFallbackResponse(message, detectedLang);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: fallbackResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      chatHistoryRef.current = [...newHistory, assistantMsg];
      return fallbackResponse;

    } catch (err: any) {
      console.error("AI Request Failed:", err);
      const detectedLang = detectLanguage(message) || language;
      const errorMsg = getFallbackResponse(message, detectedLang);
      
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

  const getFallbackResponse = (message: string, lang: string): string => {
    const responses: Record<string, string> = {
      ru: "Здравствуйте! Чем я могу помочь вам по поводу работы, документов или построения маршрута?",
      en: "Hello! How can I assist you with jobs, documents, or building a route?",
      kk: "Сәлеметсіз бе! Жұмыс, құжаттар немесе бағыт салу бойынша қалай көмектесе аламын?",
      uz: "Assalomu alaykum! Ish, hujjatlar yoki yo'nalish bo'yicha qanday yordam bera olaman?",
      tg: "Ассалому алейкум! Ман ба шумо дар бораи кор, ҳуҷҷатҳо ва хатсайр чӣ гуна кӯмак карда метавонам?"
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