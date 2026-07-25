"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { detectIntent } from "@/lib/aiRouter";
import { appStorage } from "@/lib/appStorage";
import { subscriptionManager } from "@/lib/subscriptionManager";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: any;
}

function mapIntentToAction(intent: ReturnType<typeof detectIntent>) {
  const typeMap: Record<string, string> = {
    MAP_SEARCH: "map_search",
    JOB_SEARCH: "job_search",
    MAP_ROUTE: "route",
    OCR_TRANSLATE: "translate_photo",
    DOCUMENT_HELP: "document",
    LEGAL_HELP: "legal",
    MIGRATION_HELP: "migration",
    EMPLOYER_CHECK: "employer_check",
    GENERAL_CHAT: "chat",
  };

  return {
    type: typeMap[intent.type] || "chat",
    query:
      intent.entities.query ||
      intent.entities.profession ||
      intent.entities.location ||
      intent.entities.to ||
      intent.originalText,
    from: intent.entities.from,
    to: intent.entities.to,
    intent: intent.type,
    confidence: intent.confidence,
  };
}

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const session = appStorage.loadAssistantSession();
    if (session?.messages) {
      return session.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
      }));
    }
    return [];
  });
  const chatHistoryRef = useRef<ChatMessage[]>(messages);
  const navigate = useNavigate();
  const memoryLoadedRef = useRef(false);

  useEffect(() => {
    chatHistoryRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      appStorage.saveAssistantSession({
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
        })),
        language,
        updatedAt: Date.now(),
      });
    }
  }, [messages, language]);

  useEffect(() => {
    if (memoryLoadedRef.current) return;
    const loadMemory = async () => {
      try {
        const userPhone = localStorage.getItem("vaxtago_user_phone");
        if (!userPhone || !supabase) return;

        const { data, error } = await supabase
          .from("assistant_memory")
          .select("memory_value")
          .eq("user_id", userPhone)
          .eq("memory_key", "chat_session")
          .maybeSingle();

        if (error || !data?.memory_value) return;

        const session = JSON.parse(data.memory_value);
        if (session.messages?.length > 0) {
          const loaded = session.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
          }));
          setMessages(loaded);
          chatHistoryRef.current = loaded;
        }
      } catch (e) {
        console.warn("[AI Memory] Load failed:", e);
      } finally {
        memoryLoadedRef.current = true;
      }
    };
    loadMemory();
  }, []);

  const saveToMemory = useCallback(
    async (msgs: ChatMessage[]) => {
      try {
        const userPhone = localStorage.getItem("vaxtago_user_phone");
        if (!userPhone || !supabase) return;

        const payload = JSON.stringify({
          messages: msgs.slice(-20).map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp.toISOString(),
          })),
          language,
          updatedAt: Date.now(),
        });

        await supabase.from("assistant_memory").upsert(
          {
            user_id: userPhone,
            memory_key: "chat_session",
            memory_value: payload,
          },
          { onConflict: "user_id,memory_key" }
        );
      } catch (e) {
        console.warn("[AI Memory] Save failed:", e);
      }
    },
    [language]
  );

  useEffect(() => {
    const handleRestore = () => {
      const session = appStorage.loadAssistantSession();
      if (session?.messages?.length > 0) {
        toast.info(t("ai.restored") || "VAQTA AI восстановлен");
      }
    };
    window.addEventListener("vaqta:app-restore", handleRestore);
    return () => window.removeEventListener("vaqta:app-restore", handleRestore);
  }, [t]);

  const sendMessage = useCallback(
    async (message: string, image?: string): Promise<string | null> => {
      if ((!message.trim() && !image) || loading) return null;

      const access = await subscriptionManager.checkAccess("ai_chat");
      if (!access.allowed) {
        toast.error(t("premium.feature_locked") || "Лимит исчерпан. Обновитесь до Premium.");
        return null;
      }

      const userPhone = localStorage.getItem("vaxtago_user_phone") || "79000000000";
      setLoading(true);

      const userMsg: ChatMessage = {
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      const newHistory = [...chatHistoryRef.current, userMsg].slice(-10);
      setMessages(newHistory);
      chatHistoryRef.current = newHistory;

      const intent = detectIntent(message);
      const actionData = mapIntentToAction(intent);

      if (intent.type === "OCR_TRANSLATE") {
        setTimeout(() => navigate("/scanner"), 600);
      } else if (intent.type === "MAP_SEARCH" && intent.entities.query) {
        setTimeout(() => navigate(`/maps?search=${encodeURIComponent(intent.entities.query)}`), 600);
      } else if (intent.type === "MAP_ROUTE" && intent.entities.to) {
        setTimeout(() => navigate(`/maps?route=${encodeURIComponent(intent.entities.to)}`), 600);
      } else if (intent.type === "JOB_SEARCH") {
        setTimeout(
          () =>
            navigate(
              `/jobs-test?query=${encodeURIComponent(intent.entities.profession || intent.originalText)}`
            ),
          600
        );
      }

      try {
        let data: any = null;
        let error: any = null;

        for (let attempt = 0; attempt < 2; attempt++) {
          const result = await supabase.functions.invoke("ai-assistant", {
            body: {
              message: message.trim(),
              image,
              language_code: intent.detectedLanguage || language,
              user_phone: userPhone,
              history: newHistory.map((m) => ({ role: m.role, content: m.content })),
              intent: intent.type,
              entities: intent.entities,
            },
          });
          data = result.data;
          error = result.error;
          if (!error) break;
          if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
        }

        if (error) throw error;

        const replyText = data?.reply || data?.text || "AI жавоби олинмади.";

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: replyText,
          timestamp: new Date(),
          action: actionData,
        };

        const updatedHistory = [...newHistory, assistantMsg];
        setMessages(updatedHistory);
        chatHistoryRef.current = updatedHistory;

        await saveToMemory(updatedHistory);
        await subscriptionManager.incrementUsage("ai_chat");

        return replyText;
      } catch (err: any) {
        console.error("[AI Chat Error]", err);
        toast.error(t("ai.error") || "Алоқада хатолик юз берди");

        const errorMsg: ChatMessage = {
          role: "assistant",
          content: t("ai.try_again") || "Кечирим, хатолик юз берди. Қайта уриниб кўринг.",
          timestamp: new Date(),
        };
        const updatedHistory = [...newHistory, errorMsg];
        setMessages(updatedHistory);
        chatHistoryRef.current = updatedHistory;

        return null;
      } finally {
        setLoading(false);
      }
    },
    [language, loading, t, navigate, saveToMemory]
  );

  return { sendMessage, loading, messages };
}