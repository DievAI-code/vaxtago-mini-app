import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, Paperclip, Mic, X, Bot, Languages, MoreVertical, Trash2, Copy, Download, Plus, ChevronDown, User } from "lucide-react";
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
const MAX_DISPLAY = 100;

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatWidget() {
  const { t } = useTranslation();
  const { lang } = useApp();
  const { isInTelegram, firstName } = useTelegramUser();
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(messages.slice(-MAX_DISPLAY).map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))),
      );
    } catch {}
  }, [messages]);

  function onScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!atBottom);
  }

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

  function newChat() {
    setMessages([{ id: makeId(), role: "assistant", content: t("ai_hello"), createdAt: new Date() }]);
    setMenuOpen(false);
  }

  function clearHistory() {
    localStorage.removeItem(CACHE_KEY);
    newChat();
  }

  function exportChat() {
    const text = messages.map((m) => `${m.role === "user" ? "Вы" : "VaxtaGo"} (${formatTime(m.createdAt)}): ${m.content}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vaxtago-chat.txt";
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  }

  function copyLast() {
    const last = messages.filter((m) => m.role === "assistant").pop();
    if (last) navigator.clipboard.writeText(last.content);
    setMenuOpen(false);
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-0px)] bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-white leading-tight">VaxtaGo AI</h1>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> онлайн
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            aria-label="Menu"
          >
            <MoreVertical size={20} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-20"
              >
                <button onClick={newChat} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700">
                  <Plus size={16} /> Новый диалог
                </button>
                <button onClick={clearHistory} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700">
                  <Trash2 size={16} /> Очистить историю
                </button>
                <button onClick={exportChat} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700">
                  <Download size={16} /> Экспорт чата
                </button>
                <button onClick={copyLast} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700">
                  <Copy size={16} /> Копировать последнее
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative"
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-slate-300 dark:bg-slate-700" : "bg-gradient-to-br from-blue-600 to-cyan-400"}`}>
                {m.role === "user" ? <User size={16} className="text-slate-600 dark:text-slate-200" /> : <Bot size={16} className="text-white" />}
              </div>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-md"
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md"
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                <p className={`text-[10px] mt-1 ${m.role === "user" ? "text-blue-100" : "text-slate-400"}`}>
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}

        {showScrollBtn && (
          <button
            onClick={() => {
              const el = messagesContainerRef.current;
              if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            }}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:scale-105 transition"
            aria-label="Scroll down"
          >
            <ChevronDown size={20} />
          </button>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-end gap-2">
          <button onClick={() => fileRef.current?.click()} className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition" aria-label="Attach">
            <Paperclip size={20} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => handleSend("Распознай текст на изображении", (r.result as string).split(",")[1]);
            r.readAsDataURL(f);
          }} />
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder={t("chat_ph")}
              disabled={loading}
              className="w-full resize-none max-h-32 px-4 py-3 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent outline-none text-sm text-slate-800 dark:text-white disabled:opacity-50"
            />
            {input && (
              <button
                onClick={() => setInput("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                aria-label="Clear"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => handleSend(input)}
            disabled={loading || !input.trim()}
            className="p-3 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-white hover:scale-105 transition shadow-lg disabled:opacity-40 disabled:scale-100"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}