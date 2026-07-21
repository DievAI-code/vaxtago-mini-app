"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User, Bot, Globe, Paperclip, Camera, Mic, MoreVertical } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Assalomu alaykum 👋\n\nMen VAQTA AI yordamchisiman. Savolingizni yozing yoki rasm yuboring." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsTyping(true);
    
    // Симуляция AI
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: "assistant", content: "Sizning so'rovingiz tahlil qilinmoqda. Men sizga xalqaro standartlarga javob beradigan eng yaxshi va xavfsiz vakansiyalarni hamda hujjatlarni rasmiylashtirish yo'llarini ko'rsataman." }]);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#06140F] text-white">
      <header className="p-6 border-b border-[#1A3D2E] bg-[#06140F]/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl vaqta-gradient flex items-center justify-center vaqta-glow relative">
            <Sparkles size={20} className="text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#D4AF37] rounded-full border-2 border-[#06140F]" />
          </div>
          <div>
            <h1 className="font-black tracking-tight leading-none text-lg">VAQTA AI</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
              <span className="text-[9px] font-black text-[#5C7A6D] uppercase tracking-widest">Premium Intelligence</span>
            </div>
          </div>
        </div>
        <button className="p-2 text-[#5C7A6D]"><MoreVertical size={20}/></button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-40">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${
              m.role === "user" ? "bg-[#1A3D2E]" : "vaqta-gradient"
            }`}>
              {m.role === "user" ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed font-medium ${
              m.role === "user" 
                ? "bg-[#00A86B] text-white rounded-tr-none shadow-xl shadow-[#00A86B]/5" 
                : "bg-[#0C1F1A] border border-[#1A3D2E] rounded-tl-none"
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-2xl vaqta-gradient flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div className="bg-[#0C1F1A] border border-[#1A3D2E] p-4 rounded-[1.5rem] rounded-tl-none">
              <div className="flex gap-1.5">
                {[0,1,2].map(dot => (
                  <motion.div 
                    key={dot}
                    animate={{ opacity: [0.3, 1, 0.3] }} 
                    transition={{ repeat: Infinity, duration: 1, delay: dot * 0.2 }}
                    className="w-2 h-2 bg-[#00A86B] rounded-full" 
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-24 left-0 w-full px-6 pb-4">
        <div className="relative vaqta-glass overflow-hidden border-[#1A3D2E] focus-within:border-[#00A86B]/40 transition-all p-2 pr-4 flex items-end gap-3 shadow-2xl">
          <div className="flex gap-1 mb-2">
            <button className="p-2.5 text-[#5C7A6D] hover:text-[#00A86B] transition-colors"><Paperclip size={20}/></button>
            <button className="p-2.5 text-[#5C7A6D] hover:text-[#00A86B] transition-colors"><Camera size={20}/></button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Savolingizni yozing..."
            className="flex-1 bg-transparent py-3 text-sm text-white placeholder-[#5C7A6D] focus:outline-none resize-none max-h-32 min-h-[48px] no-scrollbar font-medium"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="mb-1.5 p-3 bg-[#00A86B] text-white rounded-2xl hover:scale-105 transition-all disabled:opacity-30 disabled:scale-100 shadow-lg shadow-[#00A86B]/20"
          >
            <Send size={20} />
          </button>
          <div className="absolute top-0 left-0 w-full h-full ai-shimmer opacity-5 pointer-events-none" />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}