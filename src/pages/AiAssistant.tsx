"use client";

import { useState, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Bot, Mic, MapPin, Copy, Volume2, Share2, Bookmark, Check, 
  Ticket, Train, Plane, Navigation, Camera, Sparkles, ChevronRight, Briefcase
} from "lucide-react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { useAiChat } from "@/hooks/useAiChat";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { VoiceControlBar } from "@/components/assistant/VoiceControlBar";
import { processSmartSearch, SmartSearchResult } from "@/lib/smartSearch";
import { AIActionCard } from "@/components/AIActionCard";
import { RouteCard } from "@/components/assistant/RouteCard";
import { MapCard } from "@/components/assistant/MapCard";
import { JobCard } from "@/components/assistant/JobCard";
import { PlaceCard } from "@/components/PlaceCard";
import { processNavigationQuery, type NavigationResult } from "@/services/navigation/navigationEngine";
import { processVoiceTranscript } from "@/services/voice/voiceProcessor";
import { voiceDebug } from "@/services/voice/voiceDebug";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const MessageActions = memo(function MessageActions({ content, isUser }: { content: string; isUser?: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(true);
    toast.success("Скопировано");
    setTimeout(() => setCopied(false), 1500);
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
  };
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text: content }).catch(() => {});
    } else {
      navigator.clipboard.writeText(content).catch(() => {});
      toast.success("Скопировано для отправки");
    }
  };
  const handleSave = () => {
    try {
      const raw = localStorage.getItem("vaqta_saved_messages") || "[]";
      const arr = JSON.parse(raw);
      arr.unshift({ content, at: new Date().toISOString() });
      localStorage.setItem("vaqta_saved_messages", JSON.stringify(arr.slice(0, 50)));
      toast.success("Сохранено");
    } catch {}
  };

  if (isUser) return null;

  return (
    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={handleCopy} className="p-1.5 rounded-lg text-[#5C7A6D] hover:text-white hover:bg-white/5 transition-colors">
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
      <button onClick={handleSpeak} className="p-1.5 rounded-lg text-[#5C7A6D] hover:text-white hover:bg-white/5 transition-colors">
        <Volume2 size={12} />
      </button>
      <button onClick={handleShare} className="p-1.5 rounded-lg text-[#5C7A6D] hover:text-white hover:bg-white/5 transition-colors">
        <Share2 size={12} />
      </button>
      <button onClick={handleSave} className="p-1.5 rounded-lg text-[#5C7A6D] hover:text-white hover:bg-white/5 transition-colors">
        <Bookmark size={12} />
      </button>
    </div>
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
  const navigate = useNavigate();
  const { sendMessage, loading: isTyping, messages, addUserMessage } = useAiChat();
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [smartResults, setSmartResults] = useState<Record<number, SmartSearchResult>>({});
  const [navResults, setNavResults] = useState<Record<number, NavigationResult | null>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const voice = useVoiceAssistant({ autoSendToAI: true });

  const handleVoiceTranscript = (text: string) => {
    voiceDebug.log("Voice Transcript Received", { text });
    
    const result = processVoiceTranscript(text);
    
    if (result.transcript) {
      voiceDebug.log("Sending to handleSend", { 
        transcript: result.transcript, 
        intent: result.intent,
        action: result.action 
      });
      handleSend(result.transcript);
    } else {
      voiceDebug.log("Error", { message: "Empty transcript after processing" });
      toast.error("Не удалось распознать речь. Попробуйте ещё раз.");
    }
  };

  useEffect(() => {
    if (!voice.settings.autoSpeak) return;
    if (messages.length < 2) return;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant") return;
    if (Date.now() - new Date(last.timestamp as any).getTime() < 5000) {
      voice.speak(last.content);
    }
  }, [messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim() || isTyping) return;
    if (!customText) setInput("");

    const navResult = await processNavigationQuery(text);
    
    if (navResult && navResult.intent.type === "route") {
      const newIndex = messages.length;
      setNavResults((prev) => ({ ...prev, [newIndex]: navResult }));
      addUserMessage(text);
      return;
    }

    const newIndex = messages.length;
    const smart = await processSmartSearch(text);
    setSmartResults((prev) => ({ ...prev, [newIndex]: smart }));

    await sendMessage(text);
  };

  const SUGGESTIONS = [
    { icon: Ticket, label: "🎫 Билет", color: "text-[#D4AF37]", cmd: "Купить билет Москва Ташкент" },
    { icon: Train, label: "🚆 Поезд", color: "text-blue-400", cmd: "Купить жд билет" },
    { icon: Plane, label: "✈️ Самолёт", color: "text-cyan-400", cmd: "Купить авиабилет" },
    { icon: Navigation, label: "🗺 Маршрут", color: "text-purple-400", cmd: "Как доехать от цирка до жд вокзала Тюмени" },
    { icon: Camera, label: "📷 Фото", color: "text-pink-400", cmd: "Перевести фото" },
    { icon: MapPin, label: "📍 Адрес", color: "text-orange-400", cmd: "Найди ближайший магазин" },
    { icon: Briefcase, label: "💼 Работа", color: "text-[#0AA86E]", cmd: "Найти работу сварщиком" },
  ];

  return (
    <div className="flex flex-col h-screen-dynamic bg-[#06140F] text-white overflow-hidden">
      <Header title="VAQTA AI 3.0" onMenuClick={() => setMenuOpen(true)} showBack />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 no-scrollbar space-y-5 pb-44" ref={scrollRef}>
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 space-y-6">
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
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-black vaqta-gold-text tracking-tighter">VAQTA AI</h2>
                <p className="text-xs font-bold text-[#5C7A6D] uppercase tracking-[0.2em]">{t("ai.welcome")}</p>
              </div>

              <div className="vaqta-glass p-3 border-[#1A3D2E] text-[10px] text-[#5C7A6D] font-bold uppercase tracking-widest">
                <Mic size={12} className="inline-block mr-1 text-[#0AA86E]" />
                Можно говорить — нажмите на микрофон
              </div>

              <div className="grid grid-cols-1 gap-2.5 max-w-sm mx-auto">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSend(s.cmd)}
                    className="vaqta-glass p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <s.icon size={20} className={s.color} />
                      <span className="text-xs font-bold uppercase tracking-wider">{s.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-[#1A3D2E] group-hover:text-white transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((m, i) => {
            const smart = smartResults[i];
            const nav = navResults[i];

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn("flex flex-col group", m.role === "user" ? "items-end" : "items-start")}
              >
                <div className={cn("px-5 py-3.5 text-xs sm:text-sm font-medium leading-relaxed max-w-[88%] shadow-2xl", m.role === "user" ? "message-user" : "message-ai")}>
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

                  {nav?.intent.type === "route" && (
                    <div className="mt-2">
                      <RouteCard
                        fromName={nav.fromPlace?.name || nav.intent.from || "Моё местоположение"}
                        fromCoords={nav.fromPlace ? { lat: nav.fromPlace.latitude, lon: nav.fromPlace.longitude } : undefined}
                        toName={nav.toPlace?.name || nav.intent.to || ""}
                        toCoords={nav.toPlace ? { lat: nav.toPlace.latitude, lon: nav.toPlace.longitude } : undefined}
                        distance={nav.formattedDistance}
                        duration={nav.formattedDuration}
                        mode={nav.intent.mode}
                        city={nav.intent.city}
                      />
                    </div>
                  )}

                  {(nav?.intent.type === "place_search" || nav?.intent.type === "nearby_search") && nav.toPlace && (
                    <div className="mt-2">
                      <PlaceCard
                        place={{
                          id: nav.toPlace.name,
                          name: nav.toPlace.name,
                          address: nav.toPlace.address,
                          latitude: nav.toPlace.latitude,
                          longitude: nav.toPlace.longitude,
                          phone: nav.toPlace.phone,
                          rating: nav.toPlace.rating,
                          hours: nav.toPlace.hours,
                          category: nav.toPlace.category,
                          source: nav.toPlace.source,
                        }}
                        distance={nav.formattedDistance}
                      />
                    </div>
                  )}

                  {m.action?.type === "map_search" && <MapCard query={m.action.query} onActionComplete={() => {}} />}
                  {m.action?.type === "job_search" && <JobCard query={m.action.query} />}
                </div>

                <div className="flex items-center gap-2 mt-1.5 px-2">
                  {m.role === "assistant" && <span className="w-1.5 h-1.5 rounded-full bg-[#0AA86E]" />}
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#5C7A6D]">
                    {m.role === "user" ? "You" : "VAQTA AI"}
                  </span>
                  <span className="text-[9px] text-[#5C7A6D]">·</span>
                  <span className="text-[9px] text-[#5C7A6D]">
                    {formatTime(m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp))}
                  </span>
                  <MessageActions content={m.content} isUser={m.role === "user"} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
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
        <div className="max-w-3xl mx-auto liquid-glass p-2.5 space-y-1.5 shadow-[0_30px_90px_rgba(0,0,0,0.9)] rounded-[2.2rem] pointer-events-auto border-emerald-500/20">
          <div className="px-1">
            <VoiceControlBar
              onTranscript={handleVoiceTranscript}
              autoSend={true}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSend("купить билет")}
              className="p-3 text-[#D4AF37] hover:text-white transition-colors"
              title="Билет"
            >
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
      </div>

      <BottomNav />
    </div>
  );
}