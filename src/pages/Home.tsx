"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, X, ImageIcon, Camera, Mic, Briefcase, FileText, MapPin, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { useLanguage } from "@/context/LanguageProvider";
import { useAiChat } from "@/hooks/useAiChat";
import { MapCard } from "@/components/assistant/MapCard";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { subscription } from "@/services/subscription";

export default function Home() {
  const nav = useNavigate();
  const { t, language } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { sendMessage, loading: isTyping, messages } = useAiChat();

  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isTyping) return;

    const access = await subscription.checkUserAccess("ai");
    if (!access.allowed) {
      toast.error(t("premium.feature_locked") || "AI limit tugadi.");
      return;
    }

    const userMsg = input.trim();
    setInput("");
    const img = attachedImage;
    setAttachedImage(null);

    await sendMessage(userMsg, img || undefined);
    await subscription.trackUsage("ai");
  };

  const getGreeting = () => {
    if (language === "uz") {
      return "Salom! Men VAQTA AI yordamchisiman.\nIsh, hujjatlar, tarjima va manzillar bo'yicha yordam beraman.";
    }
    if (language === "en") {
      return "Hello! I am VAQTA AI Assistant.\nI help with jobs, documents, translation, and addresses.";
    }
    return "Здравствуйте! Я VAQTA AI помощник.\nПомогаю с работой, документами, переводом и адресами.";
  };

  const QUICK_PROMPTS = [
    { label: "🔍 " + t("home.find_job"), prompt: "Покажи вакансии для вахты" },
    { label: "📍 " + t("home.find_address"), prompt: "ЖД Вокзал в Тюмени" },
    { label: "📄 " + t("home.check_doc"), path: "/contract-audit" },
    { label: "📷 " + t("home.translate_photo"), path: "/scanner" },
  ];

  return (
    <div className="flex flex-col h-screen-dynamic bg-[#06140F] text-white overflow-hidden">
      <Header title="nav.home" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar smooth-scroll pb-36">
        {/* Main Banner Greeting */}
        <div className="vaqta-glass p-5 border-[#00A86B]/30 bg-gradient-to-br from-[#00A86B]/15 via-transparent to-transparent space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl vaqta-gradient flex items-center justify-center text-white shadow-xl vaqta-glow">
              <Bot size={28} />
            </div>
            <div>
              <span className="font-black text-white text-base">VAQTA <span className="text-[#00A86B]">AI</span></span>
              <p className="text-[10px] text-[#00A86B] font-bold uppercase tracking-widest">Digital Assistant</p>
            </div>
          </div>
          <h2 className="text-sm font-black text-white leading-relaxed whitespace-pre-line">
            {getGreeting()}
          </h2>
        </div>

        {/* Quick Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {QUICK_PROMPTS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (q.path) nav(q.path);
                else if (q.prompt) {
                  setInput(q.prompt);
                }
              }}
              className="px-3 py-2 bg-[#0C1F1A] border border-[#1A3D2E] rounded-xl text-xs font-bold text-white whitespace-nowrap hover:border-[#00A86B] active:scale-95 transition-all shadow-md"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Dynamic Chat Stream */}
        {messages.map((m, i) => (
          <div key={i} className="space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ${m.role === "user" ? "bg-[#1A3D2E]" : "vaqta-gradient"}`}>
                {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed font-bold shadow-xl ${m.role === "user" ? "bg-[#00A86B] text-white rounded-tr-none" : "bg-[#0C1F1A] border border-[#1A3D2E] rounded-tl-none text-slate-100"}`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </motion.div>

            {m.role === "assistant" && m.action && (
              <div className="pl-10">
                <MapCard 
                  query={m.action.query || m.action.destination} 
                  type={m.action.action === "MAP_ROUTE" ? "route" : m.action.action === "MAP_NEARBY" ? "nearby" : "search"} 
                />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-xl vaqta-gradient flex items-center justify-center">
              <Bot size={14} />
            </div>
            <div className="bg-[#0C1F1A] border border-[#1A3D2E] p-3 rounded-2xl flex gap-1.5 items-center">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-[#00A86B] rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#00A86B] rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#00A86B] rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-20 left-0 w-full px-4 pb-2 z-50">
        <AnimatePresence>
          {attachedImage && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="relative mb-2 inline-block">
              <img src={attachedImage} alt="Attached" className="w-16 h-16 rounded-xl object-cover border-2 border-[#00A86B] shadow-2xl" />
              <button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-[#06140F]">
                <X size={10} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative vaqta-glass border-[#1A3D2E] focus-within:border-[#00A86B]/50 transition-all p-2 pr-3 flex items-center gap-2 shadow-2xl">
          <div className="flex items-center gap-0.5">
            <button onClick={() => fileRef.current?.click()} className="p-2 text-[#5C7A6D] hover:text-[#00A86B] active:scale-90 transition-transform"><ImageIcon size={18} /></button>
            <button onClick={() => cameraRef.current?.click()} className="p-2 text-[#5C7A6D] hover:text-[#00A86B] active:scale-90 transition-transform"><Camera size={18} /></button>
            <button onClick={() => { setIsRecording(!isRecording); if (!isRecording) toast.info("Ovozli xabar tayyorlanmoqda..."); }} className={`p-2 transition-transform active:scale-90 ${isRecording ? "text-red-500 animate-pulse" : "text-[#5C7A6D]"}`}>
              <Mic size={18} />
            </button>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={t("chat.placeholder")}
            className="flex-1 bg-transparent py-2 text-xs text-white focus:outline-none resize-none max-h-28 min-h-[36px] no-scrollbar font-bold"
            rows={1}
          />

          <button onClick={handleSend} disabled={!input.trim() && !attachedImage} className="p-2.5 bg-[#00A86B] text-white rounded-xl disabled:opacity-20 transition-all shadow-lg active:scale-95 vaqta-glow">
            <Send size={16} />
          </button>
        </div>

        <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const r = new FileReader();
            r.onload = (ev) => setAttachedImage(ev.target?.result as string);
            r.readAsDataURL(file);
          }
        }} />
        <input type="file" ref={cameraRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const r = new FileReader();
            r.onload = (ev) => setAttachedImage(ev.target?.result as string);
            r.readAsDataURL(file);
          }
        }} />
      </div>

      <BottomNav />
    </div>
  );
}