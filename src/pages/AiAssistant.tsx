"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Bot, Mic, Plus, MapPin, Briefcase, Camera, 
  Navigation, Scale, ShieldAlert, Sparkles, ChevronRight,
  User, Image as ImageIcon, Map as MapIcon, X, Loader2
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { useAiChat, ChatMessage } from "@/hooks/useAiChat";
import { MapCard } from "@/components/assistant/MapCard";
import { JobCard } from "@/components/assistant/JobCard";
import { cn } from "@/lib/utils";

export default function AiAssistant() {
  const { t } = useLanguage();
  const { sendMessage, loading: isTyping, messages } = useAiChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  const SUGGESTIONS = [
    { icon: Briefcase, label: "ai.hint_jobs", color: "text-[#0AA86E]", cmd: "Найти работу" },
    { icon: Navigation, label: "ai.hint_route", color: "text-blue-400", cmd: "Показать маршрут до вокзала" },
    { icon: Camera, label: "ai.hint_photo", color: "text-purple-400", cmd: "Перевести фото" },
    { icon: MapPin, label: "ai.hint_address", color: "text-amber-400", cmd: "Где вокзал Тюмень?" },
  ];

  return (
    <div className="flex flex-col h-screen-dynamic bg-[#06140F] text-white overflow-hidden">
      <Header title="VAQTA AI 3.0" />

      <main className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar space-y-6 pb-40" ref={scrollRef}>
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-8">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-[2.5rem] vaqta-gradient flex items-center justify-center mx-auto shadow-2xl vaqta-glow">
                  <Bot size={48} className="text-white" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 text-[#D4AF37] animate-pulse" size={24} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black vaqta-gold-text tracking-tighter">VAQTA ASSISTANT</h2>
                <p className="text-sm font-bold text-[#5C7A6D] uppercase tracking-[0.2em]">{t("ai.welcome")}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s.cmd)} className="vaqta-glass p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-all">
                    <div className="flex items-center gap-4">
                      <s.icon size={20} className={s.color} />
                      <span className="text-xs font-bold uppercase tracking-widest">{t(s.label)}</span>
                    </div>
                    <ChevronRight size={16} className="text-[#1A3D2E] group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
              <div className={cn("px-6 py-4 text-sm font-medium leading-relaxed max-w-[85%] shadow-2xl", m.role === "user" ? "message-user" : "message-ai")}>
                {m.content}
                
                {/* Intent-based Inline Components */}
                {m.action?.type === "map_search" && <MapCard query={m.action.query} onActionComplete={() => {}} />}
                {m.action?.type === "job_search" && <JobCard query={m.action.query} />}
              </div>
              <div className="flex items-center gap-2 mt-2 px-2">
                {m.role === "assistant" && <span className="w-1.5 h-1.5 rounded-full bg-[#0AA86E]" />}
                <span className="text-[9px] font-black uppercase tracking-widest text-[#5C7A6D]">
                  {m.role === "user" ? "You" : "VAQTA AI"}
                </span>
              </div>
            </motion.div>
          ))}
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

      {/* Modern ChatGPT Input Bar */}
      <div className="fixed bottom-24 left-0 right-0 px-6 z-50 pointer-events-none">
        <div className="max-w-3xl mx-auto liquid-glass p-3 flex items-center gap-3 shadow-[0_30px_90px_rgba(0,0,0,0.9)] rounded-[2.5rem] pointer-events-auto border-emerald-500/20">
          <button className="p-3.5 text-[#5C7A6D] hover:text-white transition-colors"><Plus size={24} /></button>
          
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={t("ai.placeholder")}
            className="flex-1 bg-transparent py-3 text-sm font-bold text-white outline-none placeholder-[#1A3D2E] resize-none max-h-32"
          />

          <div className="flex gap-2 pr-1">
             <button className="p-3 text-[#5C7A6D] hover:text-white"><Mic size={22} /></button>
             <button 
               onClick={handleSend}
               disabled={!input.trim() || isTyping}
               className="p-4 bg-white text-black rounded-full shadow-2xl disabled:opacity-20 active:scale-90 transition-all vaqta-glow"
             >
               <Send size={20} />
             </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}