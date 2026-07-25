"use client";

import { useState, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Bot, Mic, MapPin, Copy, Volume2, Share2, Bookmark, Check, 
  Ticket, Train, Plane, Navigation, Camera, Sparkles, ChevronRight
} from "lucide-react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { useAiChat } from "@/hooks/useAiChat";
import { processSmartSearch, SmartSearchResult } from "@/lib/smartSearch";
import { AIActionCard } from "@/components/AIActionCard";
import { RouteCard } from "@/components/assistant/RouteCard";
import { MapCard } from "@/components/assistant/MapCard";
import { JobCard } from "@/components/assistant/JobCard";
import { detectNavigationIntent } from "@/services/aiCommands";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface MessageActionProps {
  content: string;
  onCopy?: () => void;
  onSpeak?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  isUser?: boolean;
}

const MessageActions = memo(function MessageActions({ content, onCopy, onSpeak, onShare, onSave, isUser }: MessageActionProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(true);
    toast.success("Скопировано");
    setTimeout(() => setCopied(false), 1500);
    onCopy?.();
  };
  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("Озвучка недоступна");
      return;
    }
    const u = new SpeechSynthesisUtterance(content);
    u.lang = "ru-RU";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    onSpeak?.();
  };
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text: content }).catch(() => {});
    } else {
      navigator.clipboard.writeText(content).catch(() => {});
      toast.success("Скопировано для отправки");
    }
    onShare?.();
  };
  const handleSave = () => {
    try {
      const raw = localStorage.getItem("vaqta_saved_messages") || "[]";
      const arr = JSON.parse(raw);
      arr.unshift({ content, at: new Date().toISOString() });
      localStorage.setItem("vaqta_saved_messages", JSON.stringify(arr.slice(0, 50)));
      toast.success("Сохранено");
    } catch {}
    onSave?.();
  };

  if (isUser) return null;

  return (
    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <ActionBtn icon={copied ? <Check size={12} /> : <Copy size={12} />} onClick={handleCopy} />
      <ActionBtn icon={<Volume2 size={12} />} onClick={handleSpeak} />
      <ActionBtn icon={<Share2 size={12} />} onClick={handleShare} />
      <ActionBtn icon={<Bookmark size={12} />} onClick={handleSave} />
    </div>
  );
});

const ActionBtn = memo(function ActionBtn({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 rounded-lg text-[#5C7A6D] hover:text-white hover:bg-white/5 transition-colors"
    >
      {icon}
    </button>
  );
});

const TypingDots = memo(function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 bg-[#0AA86E] rounded-full"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
});

export default function AiAssistant() {
  const { t, language } = useLanguage();
  const { sendMessage, loading: isTyping, messages } = useAiChat();
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [smartResults, setSmartResults] = useState<Record<number, SmartSearchResult>>({});
  const [routeIntents, setRouteIntents] = useState<Record<number, ReturnType<typeof detectNavigationIntent>>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim() || isTyping) return;
    if (!customText) setInput("");

    const msgIndex = messages.length + 1;

    const navIntent = detectNavigationIntent(text);
    if (navIntent.intent === "route") {
      setRouteIntents((prev) => ({ ...prev, [msgIndex]: navIntent }));
    }

    const smart = await processSmartSearch(text);
    setSmartResults((prev) => ({ ...prev, [msgIndex]: smart }));

    await sendMessage(text);
  };

  const SUGGESTIONS = [
    { icon: Briefcase, label: "ai.hint_jobs", color: "text-[#0AA86E]", cmd: "Найти работу сварщиком" },
    { icon: Ticket, label: "🎫 Билет", color: "text-[#D4AF37]", cmd: "Купить билет Москва Ташкент" },
    { icon: Train, label: "🚆 Поезд", color: "text-blue-400", cmd: "Купить жд билет" },
    { icon: Plane, label: "✈️ Самолёт", color: "text-cyan-400", cmd: "Купить авиабилет" },
    { icon: Navigation, label: "ai.hint_route", color: "text-purple-400", cmd: "Показать маршрут до вокзала" },
    { icon: Camera, label: "ai.hint_photo", color: "text-pink-400", cmd: "Перевести фото" },
    { icon: MapPin, label: "ai.hint_address", color: "text-orange-400", cmd: "Где вокзал Тюмень?" },
  ];

  return (
    <div className="flex flex-col h-screen-dynamic bg-[#06140F] text-white overflow-hidden">
      <Header title="VAQTA AI 3.0" onMenuClick={() => setMenuOpen(true)} showBack />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 no-scrollbar space-y-5 pb-44" ref={scrollRef}>
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 space-y-5">
              <div className="relative inline-block">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2.5rem] vaqta-gradient flex items-center justify-center mx-auto shadow-2xl vaqta-glow"
                >
                  <Bot size={44} className="text-white" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-[2.5rem] bg-[#0AA86E]/30 blur-xl"
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black vaqta-gold-text tracking-tighter">VAQTA AI</h2>
                <p className="text-xs font-bold text-[#5C7A6D] uppercase tracking-[0.2em]">{t("ai.welcome")}</p>
              </div>

              <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSend(s.cmd)}
                    className="vaqta-glass p-3 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-white/5 ${s.color} flex items-center justify-center`}>
                        <s.icon size={16} />
                      </div>
                      <span className="text-xs font-bold text-white">{s.label.includes(".") ? t(s.label) : s.label}</span>
                    </div>
                    <ChevronRight size={14} className="text-[#5C7A6D] group-hover:text-white transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((m, i) => {
            const smart = smartResults[i];
            const routeIntent = routeIntents[i];

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn("flex flex-col group", m.role === "user" ? "items-end" : "items-start")}
              >
                <div className={cn("px-4 py-3 text-xs sm:text-sm font-medium leading-relaxed max-w-[88%] shadow-2xl", m.role === "user" ? "message-user" : "message-ai")}>
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {smart && (
                    <AIActionCard
                      tickets={smart.tickets}
                      knowledge={smart.knowledge}
                      webSources={smart.webSources}
                      actionLabel={smart.suggestedAction?.label}
                      actionRoute={smart.suggestedAction?.route}
                      actionUrl={smart.suggestedAction?.url}
                    />
                  )}

                  {routeIntent?.intent === "route" && routeIntent.to && (
                    <div className="mt-2">
                      <RouteCard from={routeIntent.from} to={routeIntent.to} mode={routeIntent.mode} />
                      {/* Action button: open in app map */}
                      <button
                        onClick={() => {
                          const from = encodeURIComponent(routeIntent.from || "");
                          const to = encodeURIComponent(routeIntent.to);
                          const mode = routeIntent.mode || "car";
                          window.location.href = `/maps?from=${from}&to=${to}&mode=${mode}`;
                        }}
                        className="mt-2 w-full h-11 vaqta-gradient rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-white shadow-lg vaqta-glow active:scale-95 transition-transform"
                      >
                        <MapPin size={14} />
                        <span>{t("ai.open_map")}</span>
                      </button>
                    </div>
                  )}

                  {m.action?.type === "map_search" && <MapCard query={m.action.query} onActionComplete={() => {}} />}
                  {m.action?.type === "job_search" && <JobCard query={m.action.query} />}
                </div>

                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#5C7A6D]">
                    {m.role === "user" ? "You" : "VAQTA AI"}
                  </span>
                  <span className="text-[9px] text-[#5C7A6D]">·</span>
                  <span className="text-[9px] text-[#5C7A6D]">
                    {formatTime(m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp))}
                  </span>
                  <MessageActions
                    content={m.content}
                    isUser={m.role === "user"}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0AA86E] to-[#14B8A6] flex items-center justify-center">
              <Bot size={12} className="text-white" />
            </div>
            <div className="message-ai">
              <TypingDots />
            </div>
          </motion.div>
        )}
      </main>

      <div className="fixed bottom-24 left-0 right-0 px-4 sm:px-6 z-50 pointer-events-none">
        <div className="max-w-3xl mx-auto liquid-glass p-2.5 flex items-center gap-2 shadow-[0_30px_90px_rgba(0,0,0,0.9)] rounded-[2.2rem] pointer-events-auto border-emerald-500/20">
          <button type="button" onClick={() => handleSend("купить билет")} className="p-3 text-[#D4AF37] hover:text-white transition-colors" title="Билет">
            <Ticket size={20} />
          </button>

          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={t("ai.placeholder")}
            className="flex-1 bg-transparent py-2.5 text-xs sm:text-sm font-bold text-white outline-none placeholder-[#1A3D2E] resize-none max-h-28"
          />

          <div className="flex gap-1.5 pr-1">
            <button type="button" className="p-2.5 text-[#5C7A6D] hover:text-white" title="Голос">
              <Mic size={20} />
            </button>
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="p-3 bg-white text-black rounded-full shadow-2xl disabled:opacity-20 active:scale-90 transition-all vaqta-glow"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}