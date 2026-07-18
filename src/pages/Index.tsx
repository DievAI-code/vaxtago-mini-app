import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, Image as ImageIcon, Camera, Briefcase, Building2, Globe, MapPin, Crown, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp, stagger, fadeUp, TypingDots } from "@/components/animations";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
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
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-100 dark:bg-slate-800 rounded-lg p-2 my-1 overflow-x-auto text-xs">$1</pre>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

const QUICK = [
  { icon: <Camera className="w-5 h-5" />, label: "Скан документа", q: "Распознай документ", path: "/scanner" },
  { icon: <Briefcase className="w-5 h-5" />, label: "Найти вакансии", q: "Найди работу", path: "/jobs" },
  { icon: <Building2 className="w-5 h-5" />, label: "Проверить работодателя", q: "Проверь работодателя" },
  { icon: <Globe className="w-5 h-5" />, label: "Перевести", q: "Переведи текст" },
  { icon: <MapPin className="w-5 h-5" />, label: "Найти адрес", q: "Найди адрес" },
  { icon: <Crown className="w-5 h-5" />, label: "Premium", q: "Расскажи о Premium" },
];

export default function Index() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { lang } = useApp();
  const { isInTelegram } = useTelegramUser();
  const { sendMessage, loading } = useAiChat({ onError: (msg) => setMessages((m) => [...m, { id: makeId(), role: "assistant", content: msg, createdAt: new Date() }]) });

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (started && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading, started]);

  const handleSend = useCallback(async (text: string, image?: string) => {
    if (!text.trim() && !image) return;
    setStarted(true);
    setMessages((m) => [...m, { id: makeId(), role: "user", content: image ? "📷 Документ" : text, createdAt: new Date() }]);
    if (!image) setInput("");
    const reply = await sendMessage(text, image);
    if (reply) setMessages((m) => [...m, { id: makeId(), role: "assistant", content: reply, createdAt: new Date() }]);
  }, [sendMessage]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); }
  };

  if (started) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#F8FAFC] dark:bg-[#0F172A]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <button onClick={() => setStarted(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" aria-label="Back to home">←</button>
          <VaxtaGoLogo size={32} />
          <div>
            <h1 className="font-bold text-slate-800 dark:text-white leading-tight text-sm">VaxtaGo AI</h1>
            <p className="text-[10px] text-[#14B8A6] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#14B8A6] inline-block" /> онлайн</p>
          </div>
        </div>

        <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-slate-300 dark:bg-slate-700" : "bg-gradient-to-br from-[#2563EB] to-[#14B8A6]"}`}>
                  {m.role === "user" ? <span className="text-xs text-slate-600 dark:text-slate-200">Вы</span> : <VaxtaGoLogo size={20} />}
                </div>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${m.role === "user" ? "bg-[#2563EB] text-white rounded-br-md" : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md"}`}>
                  {m.role === "assistant" ? <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} /> : <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>}
                  <span className={`text-[10px] mt-1 block ${m.role === "user" ? "text-blue-100 text-right" : "text-slate-400"}`}>{formatTime(m.createdAt)}</span>
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
        </div>

        <div className="flex-shrink-0 p-3 bg-white dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-800" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <div className="flex items-end gap-2">
            <button onClick={() => fileRef.current?.click()} className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition" aria-label="Attach"><Paperclip size={20} /></button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => handleSend("Распознай текст на изображении", (r.result as string).split(",")[1]); r.readAsDataURL(f); }} />
            <div className="flex-1 relative">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} rows={1} placeholder={t("chat_ph")} disabled={loading} className="w-full resize-none max-h-32 px-4 py-3 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent outline-none text-sm text-slate-800 dark:text-white disabled:opacity-50" />
            </div>
            <button onClick={() => handleSend(input)} disabled={loading || !input.trim()} className="p-3 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] text-white hover:scale-105 transition shadow-lg disabled:opacity-40 disabled:scale-100" aria-label="Send"><Send size={18} /></button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-800 dark:text-white">
      <div className="flex-shrink-0"><Navbar /></div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        <FadeUp>
          <div className="flex items-center gap-3 mb-6">
            <VaxtaGoLogo size={44} />
            <div>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#2563EB] to-[#14B8A6] bg-clip-text text-transparent">VaxtaGo</h1>
              <p className="text-xs text-[#06B6D4] font-medium">AI Assistant</p>
            </div>
          </div>
        </FadeUp>

        <FadeUp>
          <div className="relative p-6 rounded-[20px] bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/5 to-[#14B8A6]/5 rounded-[20px] pointer-events-none" />
            <div className="relative">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Чем я могу помочь сегодня?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Ваш AI-помощник по работе, документам и жизни в России</p>

              <div className="flex items-end gap-2">
                <button onClick={() => fileRef.current?.click()} className="p-3 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0" aria-label="Attach"><Paperclip size={20} /></button>
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => handleSend("Распознай документ", (r.result as string).split(",")[1]); r.readAsDataURL(f); }} />
                <button onClick={() => fileRef.current?.click()} className="p-3 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0" aria-label="Photo"><ImageIcon size={20} /></button>
                <button className="p-3 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0" aria-label="Voice"><Mic size={20} /></button>
                <div className="flex-1 relative">
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} rows={1} placeholder="Напишите сообщение..." disabled={loading} className="w-full resize-none max-h-32 px-4 py-3 pr-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-transparent outline-none text-sm text-slate-800 dark:text-white disabled:opacity-50" />
                </div>
                <button onClick={() => handleSend(input)} disabled={loading || !input.trim()} className="p-3 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] text-white hover:scale-105 transition shadow-lg disabled:opacity-40 disabled:scale-100 flex-shrink-0" aria-label="Send"><Send size={18} /></button>
              </div>
            </div>
          </div>
        </FadeUp>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 gap-3 mt-6">
          {QUICK.map((card, i) => (
            <motion.button
              key={i}
              variants={fadeUp}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { if (card.path) nav(card.path); else handleSend(card.q); }}
              className="flex items-center gap-3 p-4 rounded-[20px] bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300 text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 to-[#14B8A6]/20 flex items-center justify-center text-[#2563EB] dark:text-[#06B6D4]">
                {card.icon}
              </div>
              <span className="font-semibold text-sm flex-1">{card.label}</span>
              <ArrowRight size={16} className="text-slate-400" />
            </motion.button>
          ))}
        </motion.div>

        <div className="mt-8"><Footer /></div>
      </div>

      <BottomNav />
    </div>
  );
}