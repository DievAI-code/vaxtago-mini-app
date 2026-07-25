"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Bot, Mic, MapPin, Briefcase, Camera, 
  Navigation, Sparkles, ChevronRight, Ticket, Train, Plane
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
    { icon: Ticket, label: "🎫 Купить билет", color: "text-[#D4AF37]", cmd: "Купить билет Москва Ташкент" },
    { icon: Train, label: "🚆 Найти поезд", color: "text-blue-400", cmd: "Купить жд билет" },
    { icon: Plane, label: "✈️ Авиабилет", color: "text-cyan-400", cmd: "Купить авиабилет" },
    { icon: Navigation, label: "ai.hint_route", color: "text-purple-400", cmd: "Показать маршрут до вокзала" },
    { icon: Camera, label: "ai.hint_photo", color: "text-pink-400", cmd: "Перевести фото" },
    { icon: MapPin, label: "ai.hint_address", color: "text-orange-400", cmd: "Где вокзал Тюмень?" },
  ];

  return (
    <div className="flex flex-col h-screen-dynamic bg-[#06140F] text-white overflow-hidden">
      <Header title="VAQTA AI 3.0" onMenuClick={() => setMenuOpen(true)} showBack />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 no-scrollbar space-y-6 pb-44" ref={scrollRef}>
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 space-y-6">
              <div className="relative inline-block">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2.5rem] vaqta-gradient flex items-center justify-center mx-auto shadow-2xl vaqta-glow">
                  <Bot size={44} className="text-white" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 text-[#D4AF37] animate-pulse" size={22} />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-black vaqta-gold-text tracking-tighter">VAQTA AI</h2>
                <p className="text-xs font-bold text-[#5C7A6D] uppercase tracking-[0.2em]">{t("ai.welcome")}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-2.5 max-w-sm mx-auto">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSend(s.cmd)} className="vaqta-glass p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-all text-left">
                    <div className="flex items-center gap-3.5">
                      <s.icon size={20} className={s.color} />
                      <span className="text-xs font-bold uppercase tracking-wider">{s.label.includes(".") ? t(s.label) : s.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-[#1A3D2E] group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((m, i) => {
            const smart = smartResults[i];
            const routeIntent = routeIntents[i];
            
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
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
                  
                  {routeIntent?.intent === "route" && routeIntent.to && (
                    <RouteCard
                      from={routeIntent.from}
                      to={routeIntent.to}
                      mode={routeIntent.mode}
                    />
                  )}
                  
                  {m.action?.type === "map_search" && <MapCard query={m.action.query} onActionComplete={() => {}} />}
                  {m.action?.type === "job_search" && <JobCard query={m.action.query} />}
                </div>
                <div className="flex items-center gap-2 mt-1.5 px-2">
                  {m.role === "assistant" && <span className="w-1.5 h-1.5 rounded-full bg-[#0AA86E]" />}
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#5C7A6D]">
                    {m.role === "user" ? "You" : "VAQTA AI"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isTyping && (
          <div className="flex items-center gap-3">
             <div className="message-ai px-5 py-4 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-[#0AA86E] rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-[#0AA86E] rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-[#0AA86E] rounded-full animate-bounce [animation-delay:0.4s]" />
             </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-24 left-0 right-0 px-4 sm:px-6 z-50 pointer-events-none">
        <div className="max-w-3xl mx-auto liquid-glass p-2.5 flex items-center gap-2 shadow-[0_30px_90px_rgba(0,0,0,0.9)] rounded-[2.2rem] pointer-events-auto border-emerald-500/20">
          <button type="button" onClick={() => handleSend("купить билет")} className="p-3 text-[#D4AF37] hover:text-white transition-colors" title="Купить билет"><Ticket size={20} /></button>
          
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={t("ai.placeholder")}
            className="flex-1 bg-transparent py-2.5 text-xs sm:text-sm font-bold text-white outline-none placeholder-[#1A3D2E] resize-none max-h-28"
          />

          <div className="flex gap-1.5 pr-1">
             <button type="button" className="p-2.5 text-[#5C7A6D] hover:text-white" title="Голосовой ввод"><Mic size={20} /></button>
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