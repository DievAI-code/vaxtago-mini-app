"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, Mic, ChevronLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { useAiChat } from "@/hooks/useAiChat";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function AiAssistant() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const { sendMessage, loading: isTyping, messages } = useAiChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
  };

  return (
    <div className="flex flex-col h-screen-dynamic bg-[#06140F] text-white overflow-hidden pb-safe">
      <Header title="nav.ai" showBack />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 no-scrollbar smooth-scroll pb-40">
        {messages.length === 0 && (
          <div className="text-center py-20 space-y-4 opacity-50">
            <Bot size={64} className="mx-auto text-[#00A86B]" />
            <p className="text-sm font-bold uppercase tracking-[0.2em]">{t("chat.welcome")}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "flex flex-col",
              m.role === "user" ? "items-end" : "items-start"
            )}
          >
            <div className={cn(
              "flex items-end gap-2 max-w-[85%]",
              m.role === "user" && "flex-row-reverse"
            )}>
              {m.role === "assistant" && (
                <div className="w-6 h-6 rounded-full vaqta-gradient flex items-center justify-center flex-shrink-0 mb-1 shadow-lg">
                  <Bot size={12} className="text-white" />
                </div>
              )}
              
              <div className={cn(
                "px-4 py-3 text-sm font-bold leading-relaxed",
                m.role === "user" ? "message-user" : "message-ai"
              )}>
                {m.content}
              </div>
            </div>
            <span className="text-[9px] font-black uppercase text-[#5C7A6D] mt-1.5 px-2">
              {m.role === "user" ? "You" : "VAQTA AI"}
            </span>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 rounded-full vaqta-gradient flex items-center justify-center"><Bot size={12} /></div>
             <div className="liquid-glass px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-[#00A86B] rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#00A86B] rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#00A86B] rounded-full" />
             </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4 z-50">
        <div className="max-w-2xl mx-auto liquid-glass p-2 flex items-center gap-2 shadow-2xl rounded-[2rem]">
          <button className="p-3 text-[#5C7A6D] hover:text-[#00A86B] transition-colors">
            <Mic size={20} />
          </button>
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("chat.placeholder") || "Напишите что-нибудь..."}
            className="flex-1 bg-transparent py-3 text-sm font-bold text-white outline-none placeholder-[#5C7A6D]"
          />

          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-3 vaqta-gradient text-white rounded-full shadow-lg disabled:opacity-30 active:scale-95 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}