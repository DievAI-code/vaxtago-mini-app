"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Cpu, 
  Trash2, 
  Languages, 
  CornerDownLeft,
  User,
  ShieldAlert
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { TypingDots } from "@/components/animations";
import { useAiChat } from "@/hooks/useAiChat";

const LANGUAGES = ["Uzbek", "Russian", "Tajik", "Kyrgyz", "English"];

export default function AiAssistant() {
  const { sendMessage, loading } = useAiChat();
  const [messages, setMessages] = useState([
    { id: "1", role: "assistant", content: "Salom! Men VAQTA AI yordamchisiman. Sizga ish topish, hujjatlar yoki shartnomani tahlil qilishda yordam bera olaman. Qaysi tilda gaplashamiz?", createdAt: new Date() }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { id: Date.now().toString(), role: "user", content: input.trim(), createdAt: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    const reply = await sendMessage(userMsg.content);
    if (reply) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: reply, createdAt: new Date() }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#06140F]">
      <header className="p-6 border-b border-[#00A86B]/10 flex items-center justify-between sticky top-0 bg-[#06140F]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl vaqta-gradient flex items-center justify-center shadow-[0_0_15px_rgba(0,168,107,0.4)]">
            <Cpu size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-black italic text-sm">VAQTA <span className="text-[#00A86B]">AI</span></h1>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
              <span className="text-[8px] font-black uppercase text-[#00A86B] tracking-widest">Neural Link Active</span>
            </div>
          </div>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
          <Trash2 size={18} />
        </button>
      </header>

      <div className="flex gap-2 px-6 py-3 overflow-x-auto no-scrollbar border-b border-white/5">
        {LANGUAGES.map(l => (
          <div key={l} className="flex-shrink-0 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-slate-400">
            {l}
          </div>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                m.role === "user" ? "bg-slate-800" : "bg-[#00A86B]/10 border border-[#00A86B]/20"
              }`}>
                {m.role === "user" ? <User size={14} /> : <Cpu size={14} className="text-[#00A86B]" />}
              </div>
              <div className={`max-w-[85%] space-y-1 ${m.role === "user" ? "text-right" : ""}`}>
                <div className={`inline-block p-4 rounded-[1.8rem] text-xs leading-relaxed shadow-sm ${
                  m.role === "user" 
                    ? "vaqta-gradient text-white rounded-tr-none" 
                    : "ai-glass border-[#00A86B]/10 rounded-tl-none text-slate-200"
                }`}>
                  {m.content}
                </div>
                <p className="text-[8px] text-slate-600 px-2 font-bold uppercase tracking-tighter">
                  {m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#00A86B]/10 border border-[#00A86B]/20 flex items-center justify-center">
              <Cpu size={14} className="text-[#00A86B]" />
            </div>
            <div className="ai-glass p-4 rounded-[1.8rem] rounded-tl-none">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 pb-32">
        <div className="ai-glass rounded-[2rem] p-2 flex items-end gap-2 border-[#00A86B]/30 focus-within:border-[#00A86B] transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Savolingizni yozing..."
            rows={1}
            className="flex-1 bg-transparent border-none py-3 pl-4 text-xs text-white placeholder-slate-500 focus:ring-0 resize-none outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-3 vaqta-gradient text-white rounded-2xl hover:scale-105 disabled:opacity-50 transition-all shadow-lg"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-[#00A86B]" /> Secured</span>
          <span className="flex items-center gap-1"><Languages size={10} className="text-[#D4AF37]" /> Auto-Translate</span>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
import { ShieldCheck } from "lucide-react";