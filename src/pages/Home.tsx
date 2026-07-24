"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, User, Bot, X, ImageIcon, Camera, Mic, 
  Briefcase, MapPin, FileText, Sparkles, Languages, Heart 
} from "lucide-react";
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

  // Requested Action Cards
  const ACTION_CARDS = [
    { 
      label: language === "uz_cyr" ? "🤖 AI ёрдамчи" : "🤖 AI yordamchi", 
      desc: language === "uz_cyr" ? "Савол ва исталган ёрдам" : "Savol va istalgan yordam",
      color: "from-[#00A86B] to-[#00D4A8]",
      action: () => nav("/ai") 
    },
    { 
      label: language === "uz_cyr" ? "📷 Расмдан таржима" : "📷 Rasmdan tarjima", 
      desc: language === "uz_cyr" ? "Ҳужжат ва чек фотоси" : "Hujjat va chek fotosi",
      color: "from-[#00A3E0] to-[#2563EB]",
      action: () => nav("/scanner") 
    },
    { 
      label: language === "uz_cyr" ? "💼 Иш топиш" : "💼 Ish topish", 
      desc: language === "uz_cyr" ? "Текширилган вакансиялар" : "Tekshirilgan vakansiyalar",
      color: "from-emerald-600 to-teal-500",
      action: () => nav("/jobs-test") 
    },
    { 
      label: language === "uz_cyr" ? "📍 Манзил топиш" : "📍 Manzil topish", 
      desc: language === "uz_cyr" ? "2ГИС харита ва маршрут" : "2GIS xarita va marshrut",
      color: "from-blue-600 to-indigo-600",
      action: () => { setInput(language.startsWith("uz") ? "Toshkent vokzali" : "Вокзал Тюмень"); } 
    },
    { 
      label: language === "uz_cyr" ? "📄 Ҳужжат ёрдам" : "📄 Hujjat yordam", 
      desc: language === "uz_cyr" ? "Патент ва шартнома" : "Patent va shartnoma",
      color: "from-purple-600 to-pink-600",
      action: () => nav("/contract-audit") 
    },
  ];

  return (
    <div className="flex flex-col h-screen-dynamic bg-[#06140F] text-white overflow-hidden">
      <Header title="nav.home" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar smooth-scroll pb-36 pt-safe">
        
        {/* Uzbekistan 🇺🇿 ⇄ 🇷🇺 Russia Friendship Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="vaqta-glass p-5 border-[#00A86B]/30 bg-gradient-to-br from-[#00A86B]/15 via-[#0C1F1A] to-[#1E40AF]/15 space-y-4 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full vaqta-friendship-badge">
              <span className="text-sm">🇺🇿</span>
              <span className="text-[10px] font-black text-[#00D4A8] uppercase tracking-wider">
                {language === "uz_cyr" ? "Ўзбекистондан" : "O'zbekistondan"}
              </span>
              <span className="text-xs text-slate-400">⇄</span>
              <span className="text-sm">🇷🇺</span>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
                {language === "uz_cyr" ? "Россияда ёрдамчи" : "Rossiyada yordamchi"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full vaqta-gradient flex items-center justify-center text-white shadow-md">
              <Bot size={18} />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">VAQTA <span className="text-[#00A86B]">AI</span></h1>
            <p className="text-xs text-slate-300 font-bold mt-1 leading-relaxed">
              {language === "uz_cyr" 
                ? "AI ёрдамчи сизга қуйидагилар бўйича ёрдам беради:" 
                : "AI yordamchi sizga quyidagilar bo'yicha yordam beradi:"}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-bold text-slate-200">
              <div className="flex items-center gap-1.5"><span className="text-[#00A86B]">•</span> {language.startsWith("uz") ? "Ish qidirish" : "Поиск работы"}</div>
              <div className="flex items-center gap-1.5"><span className="text-[#00A3E0]">•</span> {language.startsWith("uz") ? "Hujjatlar" : "Документы"}</div>
              <div className="flex items-center gap-1.5"><span className="text-blue-400">•</span> {language.startsWith("uz") ? "Tarjimalar" : "Переводы"}</div>
              <div className="flex items-center gap-1.5"><span className="text-emerald-400">•</span> {language.startsWith("uz") ? "2GIS Manzil" : "Поиск адресов"}</div>
            </div>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {ACTION_CARDS.map((card, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.95 }}
              onClick={card.action}
              className={`vaqta-glass p-4 border-[#1A3D2E] flex flex-col items-start gap-2 text-left active:scale-95 transition-all shadow-lg hover:border-[#00A86B]/50 ${idx === 4 ? "col-span-2 flex-row items-center justify-between" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                  <span className="text-base">{card.label.split(" ")[0]}</span>
                </div>
                <div>
                  <h3 className="text-xs font-black text-white leading-tight uppercase tracking-wider">{card.label.slice(2)}</h3>
                  <p className="text-[10px] text-[#5C7A6D] font-bold">{card.desc}</p>
                </div>
              </div>
            </motion.button>
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
      <div className="fixed bottom-20 left-0 w-full px-3 pb-2 z-50">
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
            <button onClick={() => { setIsRecording(!isRecording); if (!isRecording) toast.info(language.startsWith("uz") ? "Ovozli xabar yozilmoqda..." : "Запись голоса..."); }} className={`p-2 transition-transform active:scale-90 ${isRecording ? "text-red-500 animate-pulse" : "text-[#5C7A6D]"}`}>
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