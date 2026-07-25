"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Mic, Sparkles, Plus, MapPin, Briefcase, Camera, Navigation, Scale } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { useAiChat } from "@/hooks/useAiChat";
import { cn } from "@/lib/utils";

export default function AiAssistant() {
  const { t } = useLanguage();
  const { sendMessage, loading: isTyping, messages } = useAiChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleQuickCmd = (cmd: string) => {
    setInput(cmd);
    setTimeout(() => handleSend(cmd), 100);
  };

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || isTyping) return;
    setInput("");
    await sendMessage(msg);
  };

  const SUGGESTIONS = [
    { icon: Briefcase, label: "ai.hint_jobs", color: "text-[#0AA86E]" },
    { icon: Navigation, label: "ai.hint_route", color: "text-blue-400" },
    { icon: Camera, label: "ai.hint_photo", color: "text-purple-400" },
    { icon: MapPin, label: "ai.hint_address", color: "text-amber-400" },
    { icon: Scale, label: "ai.hint_org", color: "text-indigo-400" },
  ];

  return (
    <div className="flex flex-col h-screen-dynamic bg-[#06140F] text-white overflow-hidden pb-safe">
      <Header title="nav.ai" showBack />

      {/* Suggestion Bar */}
      <div className="flex gap-2 overflow-x-auto px-6 py-4 no-scrollbar border-b border-white/5">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => handleQuickCmd(t(s.label))}
            className="flex items-center gap-2 liquid-glass px-4 py-2.5 rounded-full whitespace-nowrap active:scale-95 transition-transform"
          >
            <s.icon size={14} className={s.color} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{t(s.label)}</span>
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar pb-40">
        {messages.length === 0 && (
          <div className="text-center py-20 space-y-6 opacity-60">
            <div className="w-20 h-20 rounded-[2.5rem] vaqta-gradient flex items-center justify-center mx-auto shadow-2xl vaqta-glow">
              <Bot size={44} className="text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl">{t("app_title")}</h3>
              <p className="text-sm font-medium max-w-xs mx-auto">{t("ai.welcome")}</p>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}
          >
            <div className={cn(
              "px-5 py-4 text-sm font-medium leading-relaxed max-w-[85%]",
              m.role === "user" ? "message-user" : "message-ai"
            )}>
              {m.content}
            </div>
            <span className="text-[9px] font-black uppercase text-[#5C7A6D] mt-2 px-1">
              {m.role === "user" ? "You" : "VAQTA AI"}
            </span>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full vaqta-gradient flex items-center justify-center shadow-lg"><Bot size={14} /></div>
             <div className="message-ai px-4 py-3 flex gap-1.5 items-center">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-[#0AA86E] rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#0AA86E] rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#0AA86E] rounded-full" />
             </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-24 left-0 right-0 px-6 z-50">
        <div className="max-w-2xl mx-auto liquid-glass p-2 flex items-center gap-3 shadow-[0_30px_60px_rgba(0,0,0,0.8)] rounded-[2.2rem]">
          <button className="p-3 text-slate-500 hover:text-white transition-colors">
            <Plus size={22} />
          </button>
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("ai.placeholder")}
            className="flex-1 bg-transparent py-4 text-sm font-bold text-white outline-none placeholder-slate-600"
          />

          <div className="flex gap-2 pr-2">
             <button className="p-3 text-slate-500 hover:text-white"><Mic size={22} /></button>
             <button 
               onClick={() => handleSend()}
               disabled={!input.trim() || isTyping}
               className="p-3.5 bg-white text-black rounded-full shadow-lg disabled:opacity-20 active:scale-90 transition-all"
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