"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, User, Bot, Paperclip, X, MoreVertical } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useTranslation } from "react-i18next";
import { useAiChat } from "@/hooks/useAiChat";

export default function AiAssistant() {
  const { t } = useTranslation();
  const { sendMessage, loading: isTyping, messages } = useAiChat();
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isTyping) return;
    
    const userMsg = input.trim();
    setInput("");
    const img = attachedImage;
    setAttachedImage(null);
    
    await sendMessage(userMsg, img || undefined);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#06140F] text-white">
      <header className="p-6 border-b border-[#1A3D2E] bg-[#06140F]/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl vaqta-gradient flex items-center justify-center vaqta-glow relative">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-black tracking-tight text-lg">{t("nav_ai")}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
              <span className="text-[9px] font-black text-[#5C7A6D] uppercase tracking-widest">Premium Intelligence</span>
            </div>
          </div>
        </div>
        <button className="p-2 text-[#5C7A6D]"><MoreVertical size={20}/></button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-40">
        {messages.length === 0 && (
          <div className="text-center py-10 opacity-50">
            <Bot size={48} className="mx-auto mb-4 text-[#00A86B]" />
            <p className="text-sm font-medium">{t("welcome_ai")}</p>
          </div>
        )}
        
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
                ? "bg-[#00A86B] text-white rounded-tr-none" 
                : "bg-[#0C1F1A] border border-[#1A3D2E] rounded-tl-none"
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-2xl vaqta-gradient flex items-center justify-center"><Bot size={18} /></div>
            <div className="bg-[#0C1F1A] border border-[#1A3D2E] p-4 rounded-[1.5rem] rounded-tl-none">
              <div className="flex gap-1.5">
                {[0,1,2].map(dot => (
                  <motion.div key={dot} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: dot * 0.2 }} className="w-2 h-2 bg-[#00A86B] rounded-full" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-24 left-0 w-full px-6 pb-4">
        {attachedImage && (
          <div className="mb-2 relative inline-block">
             <img src={attachedImage} className="w-20 h-20 object-cover rounded-xl border border-[#00A86B]" alt="attachment" />
             <button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><X size={12}/></button>
          </div>
        )}
        <div className="relative vaqta-glass overflow-hidden border-[#1A3D2E] focus-within:border-[#00A86B]/40 transition-all p-2 pr-4 flex items-end gap-3 shadow-2xl">
          <div className="flex gap-1 mb-2">
            <button onClick={() => fileRef.current?.click()} className="p-2.5 text-[#5C7A6D] hover:text-[#00A86B]"><Paperclip size={20}/></button>
            <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={onFileChange} />
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={t("chat_placeholder")}
            className="flex-1 bg-transparent py-3 text-sm text-white focus:outline-none resize-none max-h-32 min-h-[48px] no-scrollbar font-medium"
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !attachedImage) || isTyping}
            className="mb-1.5 p-3 bg-[#00A86B] text-white rounded-2xl disabled:opacity-30 transition-all shadow-lg"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}