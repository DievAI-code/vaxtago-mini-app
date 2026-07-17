import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, Paperclip, Mic, X, Bot, Languages } from "lucide-react";
import { TypingDots } from "./animations";
import { useTranslation } from "react-i18next";
import { useApp } from "@/lib/theme";
import { useTelegramUser } from "./TelegramProvider";
import { useAiChat } from "@/hooks/useAiChat";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

const CACHE_KEY = "vaxtago_chat_messages";

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function ChatWidget() {
  const { t } = useTranslation();
  const { lang } = useApp();
  const { isInTelegram } = useTelegramUser();
  const { sendMessage, loading } = useAiChat({
    onError: (msg) =>
      setMessages((m) => [
        ...m,
        { id: makeId(), role: "assistant", content: msg, createdAt: new Date() },
      ]),
  });
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.map((x: any) => ({
          id: x.id || makeId(),
          role: x.role,
          content: x.content,
          createdAt: new Date(x.createdAt || Date.now()),
        }));
      }
    } catch {}
    return [
      { id: makeId(), role: "assistant", content: t("ai_hello"), createdAt: new Date() },
    ];
  });
  const [input, setInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(messages.slice(-20).map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))),
      );
    } catch {}
  }, [messages]);

  async function handleSend(text: string, image?: string) {
    if (!text.trim() && !image) return;
    const userContent = image ? "📷 " + t("scanner_title") : text;
    setMessages((m) => [
      ...m,
      { id: makeId(), role: "user", content: userContent, createdAt: new Date() },
    ]);
    if (!image) setInput("");
    const reply = await sendMessage(text, image);
    if (reply) {
      setMessages((m) => [
        ...m,
        { id: makeId(), role: "assistant", content: reply, createdAt: new Date() },
      ]);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }

  return (
    <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600/10 to-cyan-400/10 p-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">{t("chat_title")}</span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Languages size={12} /> {lang.toUpperCase()}
            </span>
          </div>
          <button className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="h-[420px] overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] p-3 rounded-2xl ${
                m.role === "user"
                  ? "ml-auto bg-gradient-to-br from-blue-600 to-blue-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white"
              }`}
            >
              {m.content}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl w-fit flex items-center gap-2">
            <TypingDots />
            <span className="text-sm text-slate-500">🤖 VaxtaGo AI думает...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-200/60 dark:border-slate-700/60 p-4 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-end gap-2">
          <button onClick={() => fileRef.current?.click()} className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Attach" disabled={loading}>
            <Paperclip size={18} />
          </button>
          <button onClick={() => fileRef.current?.click()} className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Photo" disabled={loading}>
            <ImageIcon size={18} />
          </button>
          <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Voice" disabled={loading}>
            <Mic size={18} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => handleSend("Распознай текст на изображении", (r.result as string).split(",")[1]);
            r.readAsDataURL(f);
          }} />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder={t("chat_ph")}
            disabled={loading}
            className="flex-1 resize-none max-h-24 px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none text-sm text-slate-800 dark:text-white disabled:opacity-50"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={loading}
            className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}