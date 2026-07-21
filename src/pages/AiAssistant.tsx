"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Sparkles, 
  Trash2, 
  Copy, 
  CornerDownLeft,
  User,
  Bot
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { TypingDots } from "@/components/animations";
import { useAiChat } from "@/hooks/useAiChat";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export default function AiAssistant() {
  const { sendMessage, loading } = useAiChat();
  const [messages, setMessages] = useState<Msg[]>([
    { id: "1", role: "assistant", content: "Привет! Я VaxtaGo AI. Чем я могу помочь вам сегодня?", createdAt: new Date() }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: Msg = { 
      id: Date.now().toString(), 
      role: "user", 
      content: input.trim(), 
      createdAt: new Date() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    const reply = await sendMessage(userMsg.content);
    if (reply) {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: "assistant", 
        content: reply, 
        createdAt: new Date() 
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#09090B] text-[#FAFAFA]">
      <header className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#09090B]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl vg-gradient flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight">VaxtaGo AI</h1>
            <p className="text-[10px] text-[#22C55E] uppercase font-bold tracking-widest">Онлайн</p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([messages[0]])}
          className="p-2 text-slate-500 hover:text-white transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                m.role === "user" ? "bg-slate-700" : "vg-gradient"
              }`}>
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[85%] space-y-2 ${m.role === "user" ? "text-right" : ""}`}>
                <div className={`inline-block p-4 rounded-[1.5rem] text-sm leading-relaxed ${
                  m.role === "user" 
                    ? "bg-[#2563EB] text-white rounded-tr-none" 
                    : "bg-[#18181B] border border-[#27272A] rounded-tl-none"
                }`}>
                  {m.content}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 px-2">
                  <span>{m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <button className="hover:text-white transition-colors"><Copy size={12} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full vg-gradient flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-[#18181B] border border-[#27272A] p-4 rounded-[1.5rem] rounded-tl-none">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 pb-32">
        <div className="relative group max-w-2xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            rows={1}
            className="w-full bg-[#18181B] border border-[#27272A] rounded-[1.5rem] py-4 pl-5 pr-14 text-white placeholder-slate-500 focus:outline-none focus:border-[#2563EB] transition-all resize-none overflow-hidden"
            style={{ height: input ? 'auto' : '56px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 bottom-2 p-3 bg-white text-black rounded-2xl hover:bg-slate-200 disabled:opacity-50 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-3 flex items-center justify-center gap-1">
          <CornerDownLeft size={10} /> Enter для отправки, Shift + Enter для новой строки
        </p>
      </div>

      <BottomNav />
    </div>
  );
}