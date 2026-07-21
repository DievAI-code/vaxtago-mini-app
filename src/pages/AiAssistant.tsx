"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User, Bot, Languages, Globe } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { TypingDots } from "@/components/animations";

export default function AiAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Salom! Men VAQTA AI yordamchingizman. Sizga chet elda ish topish, hujjatlar yoki tarjima bilan qanday yordam bera olaman?", lang: "uz" }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: input }]);
    setInput("");
    
    // Simulate AI
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: "Sizning so'rovingiz tahlil qilinmoqda. Men sizga eng yaxshi vakansiyalarni topishda yordam beraman.", lang: "uz" }]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen bg-[#06140F] text-white">
      <header className="p-6 border-b border-[#1A3D2E] bg-[#06140F]/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl vaqta-gradient flex items-center justify-center vaqta-glow">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-black tracking-tight">VAQTA AI</h1>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
              <span className="text-[10px] font-bold text-[#5C7A6D] uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-[#5C7A6D]">
          <Globe size={12} />
          <span>UZ • RU • EN • TJ • KG</span>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
              m.role === "user" ? "bg-[#1A3D2E]" : "vaqta-gradient"
            }`}>
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-[1.8rem] text-sm leading-relaxed ${
              m.role === "user" 
                ? "bg-[#00A86B] text-white rounded-tr-none" 
                : "bg-[#0C1F1A] border border-[#1A3D2E] rounded-tl-none"
            }`}>
              {m.content}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-6 pb-32">
        <div className="relative vaqta-glass overflow-hidden border-[#1A3D2E] focus-within:border-[#00A86B]/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Savolingizni yozing..."
            className="w-full bg-transparent py-4 pl-5 pr-14 text-sm text-white placeholder-[#5C7A6D] focus:outline-none resize-none h-14 no-scrollbar"
          />
          <button
            onClick={handleSend}
            className="absolute right-2 top-2 p-2.5 bg-[#00A86B] text-white rounded-2xl hover:scale-105 transition-transform"
          >
            <Send size={18} />
          </button>
          <div className="absolute top-0 left-0 w-full h-full ai-shimmer opacity-10 pointer-events-none" />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}