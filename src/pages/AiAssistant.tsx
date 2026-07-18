import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, Image as ImageIcon, Copy, Trash2, Download } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
import { TypingDots } from "@/components/animations";
import { useTranslation } from "react-i18next";
import { useApp } from "@/lib/theme";
import { useTelegramUser } from "@/components/TelegramProvider";
import { useAiChat } from "@/hooks/useAiChat";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
function formatTime(d: Date) { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function renderMarkdown(text: string) {
  const escaped = text.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
  return escaped
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-black/40 rounded-lg p-2 my-1 overflow-x-auto text-xs">$1</pre>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

const QUICK = [
  { label: "Скан документа", q: "Распознай документ" },
  { label: "Найти вакансии", q: "Найди работу" },
  { label: "Проверить работодателя", q: "Проверь работодателя" },
  { label: "Перевести", q: "Переведи текст" },
];

export default function AiAssistant() {
  const { t } = useTranslation();
  const { lang } = useApp();
  const { isInTelegram } = useTelegramUser();
  const { sendMessage, loading } = useAiChat({ onError: (msg) => setMessages((m) => [...m, { id: makeId(), role: "assistant", content: msg, createdAt: new Date() }]) });

  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const cached = localStorage.getItem("vaxtago_chat_messages");
      if (cached) return JSON.parse(cached).map((x: any) => ({ id: x.id || makeId(), role: x.role, content: x.content, createdAt: new Date(x.createdAt || Date.now()) }));
    } catch {}
    return [{ id: makeId(), role: "assistant", content: t("ai_hello"), createdAt: new Date() }];
  });
  const [input, setInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    try { localStorage.setItem("vaxtago_chat_messages", JSON.stringify(messages.slice(-100).map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })))); } catch {}
  }, [messages]);

  const handleSend = useCallback(async (text: string, image?: string) => {
    if (!text.trim() && !image) return;
    setMessages((m) => [...m, { id: makeId(), role: "user", content: image ? "📷 Документ" : text, createdAt: new Date() }]);
    if (!image) setInput("");
    const reply = await sendMessage(text, image);
    if (reply) setMessages((m) => [...m, { id: makeId(), role: "assistant", content: reply, createdAt: new Date() }]);
  }, [sendMessage]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); }
  };

  const clearHistory = () => setMessages([{ id: makeId(), role: "assistant", content: t("ai_hello"), createdAt: new Date() }]);
  const exportChat = () => {
    const text = messages.map((m) => `${m.role === "user" ? "Вы" : "VaxtaGo"} (${formatTime(m.createdAt)}): ${m.content}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "vaxtago-chat.txt"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#080B14] text-white" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <Header title="Vaxta AI" />
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-white/10">
        <button onClick={clearHistory} className="p-2 rounded-xl text-slate-400 hover:bg-white/5 transition" aria-label="Clear"><Trash2 size={16} /></button>
        <button onClick={exportChat} className="p-2 rounded-xl text-slate-400 hover:bg-white/5 transition" aria-label="Export"><Download size={16} /></button>
        <div className="flex-1" />
        <span className="text-xs text-[#22C55E] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22C55E] inline-block" /> онлайн</span>
      </div>

      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-slate-700" : "vg-gradient"}`}>
                {m.role === "user" ? <span className="text-xs">Вы</span> : <VaxtaGoLogo size={20} />}
              </div>
              <div className={`group max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${m.role === "user" ? "bg-[#2563EB] text-white rounded-br-md" : "glass-card text-slate-100 rounded-bl-md"}`}>
                {m.role === "assistant" ? <div className="prose prose-sm max-w-none prose-invert" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} /> : <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] ${m.role === "user" ? "text-blue-100" : "text-slate-400"}`}>{formatTime(m.createdAt)}</span>
                  <button onClick={() => navigator.clipboard.writeText(m.content)} className={`opacity-0 group-hover:opacity-100 transition ${m.role === "user" ? "text-blue-100" : "text-slate-400"}`} aria-label="Copy"><Copy size={12} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full vg-gradient flex items-center justify-center"><VaxtaGoLogo size={20} /></div>
            <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"><TypingDots /></div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 px-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {QUICK.map((q) => (
            <button key={q.label} onClick={() => handleSend(q.q)} className="px-3 py-1.5 rounded-full glass-card text-xs whitespace-nowrap hover:bg-white/10 transition">{q.label}</button>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 p-3 bg-[#080B14] border-t border-white/10" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <div className="flex items-end gap-2">
          <button onClick={() => fileRef.current?.click()} className="p-2.5 rounded-full text-slate-400 hover:bg-white/5 transition" aria-label="Attach"><Paperclip size={20} /></button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => handleSend("Распознай текст на изображении", (r.result as string).split(",")[1]); r.readAsDataURL(f); }} />
          <button onClick={() => fileRef.current?.click()} className="p-2.5 rounded-full text-slate-400 hover:bg-white/5 transition" aria-label="Photo"><ImageIcon size={20} /></button>
          <button className="p-2.5 rounded-full text-slate-400 hover:bg-white/5 transition" aria-label="Voice"><Mic size={20} /></button>
          <div className="flex-1 relative">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} rows={1} placeholder={t("chat_ph")} disabled={loading} className="w-full resize-none max-h-32 px-4 py-3 pr-2 rounded-2xl glass-card border-0 outline-none text-sm text-white placeholder-slate-400 disabled:opacity-50" />
          </div>
          <button onClick={() => handleSend(input)} disabled={loading || !input.trim()} className="p-3 rounded-full vg-gradient text-white hover:scale-105 transition shadow-lg disabled:opacity-40 disabled:scale-100" aria-label="Send"><Send size={18} /></button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}