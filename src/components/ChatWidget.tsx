import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, X, MoreVertical, Plus, Trash2, Copy, Download, Pencil, ChevronDown, User, Menu, Mic, Image as ImageIcon } from "lucide-react";
import { TypingDots } from "./animations";
import { useTranslation } from "react-i18next";
import { useApp } from "@/lib/theme";
import { useTelegramUser } from "./TelegramProvider";
import { useAiChat } from "@/hooks/useAiChat";
import { ChatHistory, useChatSessions } from "./ChatHistory";
import { VaxtaGoLogo } from "./VaxtaGoLogo";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

const CACHE_KEY = "vaxtago_chat_messages";
const MAX_DISPLAY = 100;
const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
function formatTime(d: Date) { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function renderMarkdown(text: string) {
  const escaped = text.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
  return escaped.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-100 dark:bg-slate-800 rounded-lg p-2 my-1 overflow-x-auto text-xs">$1</pre>').replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
}

const QUICK_ACTIONS = ["Перевести", "Документ", "Работа", "Помощь"];

export function ChatWidget() {
  const { t } = useTranslation();
  const { lang } = useApp();
  const { isInTelegram } = useTelegramUser();
  const { sendMessage, loading } = useAiChat({ onError: (msg) => setMessages((m) => [...m, { id: makeId(), role: "assistant", content: msg, createdAt: new Date() }]) });
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached).map((x: any) => ({ id: x.id || makeId(), role: x.role, content: x.content, createdAt: new Date(x.createdAt || Date.now()) }));
    } catch {}
    return [{ id: makeId(), role: "assistant", content: t("ai_hello"), createdAt: new Date() }];
  });
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { sessions, activeId, createSession, deleteSession, renameSession, selectSession } = useChatSessions();

  useEffect(() => { const el = messagesContainerRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, loading]);
  useEffect(() => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(messages.slice(-MAX_DISPLAY).map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })))); } catch {} }, [messages]);

  const onScroll = useCallback(() => {
    const el = messagesContainerRef.current; if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
  }, []);

  const handleSend = useCallback(async (text: string, image?: string) => {
    if (!text.trim() && !image) return;
    setMessages((m) => [...m, { id: makeId(), role: "user", content: image ? "📷 " + t("scanner_title") : text, createdAt: new Date() }]);
    if (!image) setInput("");
    const reply = await sendMessage(text, image);
    if (reply) setMessages((m) => [...m, { id: makeId(), role: "assistant", content: reply, createdAt: new Date() }]);
  }, [sendMessage, t]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); }
  };

  function newChat() { createSession(); setMessages([{ id: makeId(), role: "assistant", content: t("ai_hello"), createdAt: new Date() }]); setMenuOpen(false); setHistoryOpen(false); }
  function clearHistory() { setMessages([{ id: makeId(), role: "assistant", content: t("ai_hello"), createdAt: new Date() }]); setMenuOpen(false); }
  function exportChat() {
    const text = messages.map((m) => `${m.role === "user" ? "Вы" : "VaxtaGo"} (${formatTime(m.createdAt)}): ${m.content}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "vaxtago-chat.txt"; a.click(); URL.revokeObjectURL(url); setMenuOpen(false);
  }
  function copyLast() { const last = messages.filter((m) => m.role === "assistant").pop(); if (last) navigator.clipboard.writeText(last.content); setMenuOpen(false); }
  function startRename() { setNewTitle(sessions.find((s) => s.id === activeId)?.title || ""); setRenaming(true); setMenuOpen(false); }
  function confirmRename() { if (newTitle.trim()) renameSession(activeId, newTitle.trim()); setRenaming(false); }
  function deleteChat() { deleteSession(activeId); setMessages([{ id: makeId(), role: "assistant", content: t("ai_hello"), createdAt: new Date() }]); setMenuOpen(false); }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8FAFC] dark:bg-[#0F172A]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          {!isInTelegram && <button onClick={() => setHistoryOpen(true)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden" aria-label="History"><Menu size={20} /></button>}
          <VaxtaGoLogo size={36} />
          <div>
            <h1 className="font-bold text-slate-800 dark:text-white leading-tight">VaxtaGo AI</h1>
            <p className="text-xs text-[#14B8A6] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#14B8A6] inline-block" /> онлайн</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={newChat} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" aria-label="New chat"><Plus size={20} /></button>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" aria-label="Menu"><MoreVertical size={20} /></button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-30">
                  <button onClick={newChat} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700"><Plus size={16} /> Новый чат</button>
                  <button onClick={clearHistory} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700"><Trash2 size={16} /> Очистить</button>
                  <button onClick={startRename} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700"><Pencil size={16} /> Переименовать</button>
                  <button onClick={exportChat} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700"><Download size={16} /> Экспорт</button>
                  <button onClick={deleteChat} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 size={16} /> Удалить</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {renaming && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 w-full max-w-sm">
            <h3 className="font-semibold mb-3 text-slate-800 dark:text-white">Переименовать чат</h3>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRenaming(false)} className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200">Отмена</button>
              <button onClick={confirmRename} className="flex-1 py-2 rounded-xl bg-[#2563EB] text-white">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesContainerRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 relative">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-slate-300 dark:bg-slate-700" : "bg-gradient-to-br from-[#2563EB] to-[#14B8A6]"}`}>
                {m.role === "user" ? <User size={16} className="text-slate-600 dark:text-slate-200" /> : <VaxtaGoLogo size={20} />}
              </div>
              <div className={`group max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${m.role === "user" ? "bg-[#2563EB] text-white rounded-br-md" : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md"}`}>
                {m.role === "assistant" ? <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} /> : <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>}
                <div className={`flex items-center gap-2 mt-1 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <span className={`text-[10px] ${m.role === "user" ? "text-blue-100" : "text-slate-400"}`}>{formatTime(m.createdAt)}</span>
                  <button onClick={() => navigator.clipboard.writeText(m.content)} className={`opacity-0 group-hover:opacity-100 transition ${m.role === "user" ? "text-blue-100" : "text-slate-400"}`} aria-label="Copy"><Copy size={12} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center"><VaxtaGoLogo size={20} /></div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"><TypingDots /></div>
          </div>
        )}
        {showScrollBtn && (
          <button onClick={() => { const el = messagesContainerRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }} className="sticky bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#2563EB] text-white shadow-lg flex items-center justify-center hover:scale-105 transition" aria-label="Scroll down"><ChevronDown size={20} /></button>
        )}
      </div>

      <div className="flex-shrink-0 flex gap-2 px-4 py-2 overflow-x-auto">
        {QUICK_ACTIONS.map((q) => (
          <button key={q} onClick={() => handleSend(q)} className="px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs whitespace-nowrap hover:bg-blue-50 dark:hover:bg-slate-700">{q}</button>
        ))}
      </div>

      <div className="flex-shrink-0 p-3 bg-white dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-800" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <div className="flex items-end gap-2">
          <button onClick={() => fileRef.current?.click()} className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition" aria-label="Attach"><Paperclip size={20} /></button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => handleSend("Распознай текст на изображении", (r.result as string).split(",")[1]); r.readAsDataURL(f); }} />
          <button onClick={() => fileRef.current?.click()} className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition" aria-label="Image"><ImageIcon size={20} /></button>
          <button className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition" aria-label="Voice"><Mic size={20} /></button>
          <div className="flex-1 relative">
            <textarea ref={undefined} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} rows={1} placeholder={t("chat_ph")} disabled={loading} className="w-full resize-none max-h-32 px-4 py-3 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent outline-none text-sm text-slate-800 dark:text-white disabled:opacity-50" />
            {input && (<button onClick={() => setInput("")} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600" aria-label="Clear"><X size={16} /></button>)}
          </div>
          <button onClick={() => handleSend(input)} disabled={loading || !input.trim()} className="p-3 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] text-white hover:scale-105 transition shadow-lg disabled:opacity-40 disabled:scale-100" aria-label="Send"><Send size={18} /></button>
        </div>
      </div>

      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setHistoryOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 shadow-xl md:hidden">
              <ChatHistory sessions={sessions} activeId={activeId} onSelect={(id) => { selectSession(id); setHistoryOpen(false); }} onNew={newChat} onDelete={deleteSession} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatWidget;