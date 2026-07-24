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

function sanitizeAiResponse(text: string): string {
  if (!text) return "";
  return text
    .replace(/я не могу показать карт[ыу]/gi, "VAQTA AI харитасини очмоқдаман...")
    .replace(/воспользоваться google maps/gi, "VAQTA AI харитасидан фойдаланиш")
    .replace(/яндекс\.картами|google maps/gi, "VAQTA AI харитаси");
}

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatHistoryRef = useRef<ChatMessage[]>([]);
  const lastActionContext = useRef<{ lastAction?: AIActionType; lastQuery?: string }>({});
  const navigate = useNavigate();

  const sendMessage = useCallback(async (message: string, image?: string): Promise<string | null> => {
    if ((!message.trim() && !image) || loading) return null;
    
    const userPhone = localStorage.getItem("vaxtago_user_phone") || "79000000000";

    setLoading(true);

    const detectedAction = detectAIAction(message, lastActionContext.current);

    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date()
    };
    
    const newHistory = [...chatHistoryRef.current, userMsg].slice(-10);
    setMessages(newHistory);
    chatHistoryRef.current = newHistory;

    try {
      // 1. Photo translate shortcut
      if (detectedAction.action === "PHOTO_TRANSLATE" && !image) {
        const replyText = detectedAction.message || "Расмни юборинг. Мен матнни ўқийман ва таржима қилиб бераман.";
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: replyText,
          timestamp: new Date(),
        };
        const updatedHistory = [...newHistory, assistantMsg];
        setMessages(updatedHistory);
        chatHistoryRef.current = updatedHistory;
        setLoading(false);
        setTimeout(() => navigate("/scanner"), 1200);
        return replyText;
      }

      // 2. Map / Location Search
      if (detectedAction.action === "MAP_SEARCH" && detectedAction.query) {
        const queryText = detectedAction.query;
        const replyText = `📍 ${queryText} бўйича 2ГИС харитасини очмоқдаман...`;

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

        setTimeout(() => {
          navigate(`/maps?search=${encodeURIComponent(queryText)}`);
        }, 900);

        return replyText;
      }

      // 3. Job Search with direct prompt or interactive chips
      if (detectedAction.action === "WORK_SEARCH") {
        lastActionContext.current = { lastAction: "WORK_SEARCH", lastQuery: detectedAction.profession };

        if (detectedAction.city) {
          const replyText = detectedAction.message || `${detectedAction.city} бўйича вакансиялар тайёрланмоқда...`;
          const assistantMsg: ChatMessage = {
            role: "assistant",
            content: replyText,
            timestamp: new Date(),
            action: detectedAction
          };
          const updatedHistory = [...newHistory, assistantMsg];
          setMessages(updatedHistory);
          chatHistoryRef.current = updatedHistory;

          setTimeout(() => navigate(`/jobs-test?query=${encodeURIComponent(detectedAction.city)}`), 1000);
          setLoading(false);
          return replyText;
        }

        const replyText = detectedAction.message || "Албатта ёрдам бераман. Қайси шаҳарда иш керак?";
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: replyText,
          timestamp: new Date(),
          chips: detectedAction.chips,
        };
        const updatedHistory = [...newHistory, assistantMsg];
        setMessages(updatedHistory);
        chatHistoryRef.current = updatedHistory;
        setLoading(false);
        return replyText;
      }

      // 4. Document / Patent Help with chips
      if (detectedAction.action === "DOCUMENT_HELP") {
        const replyText = detectedAction.message || "Патент ва миграция бўйича ёрдам бераман.";
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: replyText,
          timestamp: new Date(),
          chips: detectedAction.chips,
        };
        const updatedHistory = [...newHistory, assistantMsg];
        setMessages(updatedHistory);
        chatHistoryRef.current = updatedHistory;
        setLoading(false);
        return replyText;
      }

      // 5. Standard AI query via Supabase Edge Function
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

      const rawReply = data?.reply || "ИИ жавоб берди.";
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
      toast.error(t("ai.error") || "Алоқада хатолик юз берди");
      return null;
    } finally {
      setLoading(false);
    }
  }, [language, loading, t, navigate]);

  return { sendMessage, loading, messages };
}