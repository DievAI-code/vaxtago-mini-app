"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, User, Bot, X, ImageIcon, Camera, Mic, 
  Briefcase, MapPin, FileText, Sparkles, Languages 
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { useAiChat } from "@/hooks/useAiChat";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { MapCard } from "@/components/assistant/MapCard";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AiAssistant() {
  const { t, language } = useLanguage();
  const { sendMessage, loading: isTyping, messages } = useAiChat();
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const nav = useNavigate();

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText !== undefined ? overrideText : input;
    if ((!textToSend.trim() && !attachedImage) || isTyping) return;

    setInput("");
    const img = attachedImage;
    setAttachedImage(null);

    await sendMessage(textToSend.trim(), img || undefined);
  };

  const getGreeting = () => {
    if (language === "uz_cyr") {
      return "Сизга иш, ҳужжатлар, таржима ва манзиллар бўйича ёрдам бераман";
    }
    if (language === "uz") {
      return "Sizga ish, hujjatlar, tarjima va manzillar bo'yicha yordam beraman";
    }
    if (language === "en") {
      return "Hello! I am VAQTA AI Assistant.\nI help with jobs, documents, translation, and addresses.";
    }
    return "Здравствуйте! Я VAQTA AI помощник.\nПомогаю с работой, документами, переводом и адресами.";
  };

  const TOP_QUICK_BUTTONS = [
    { label: language.startsWith("uz") ? "🤖 Савол бериш" : "🤖 Задать вопрос", action: () => setInput(language.startsWith("uz") ? "Патент муддати қанча?" : "Сколько стоит патент?") },
    { label: language.startsWith("uz") ? "📷 Расм таржима" : "📷 Фото перевод", action: () => nav("/scanner") },
    { label: language.startsWith("uz") ? "💼 Иш топиш" : "💼 Поиск работы", action: () => handleSend(language.startsWith("uz") ? "иш керак" : "нужна работа") },
    { label: language.startsWith("uz") ? "📍 Манзил топиш" : "📍 Найти адрес", action: () => setInput(language.startsWith("uz") ? "Тюмень вокзал" : "Вокзал Тюмень") },
    { label: language.startsWith("uz") ? "📄 Ҳужжатлар" : "📄 Документы", action: () => handleSend(language.startsWith("uz") ? "патент керак" : "помощь с патентом") },
  ];

  return (
    <div className="flex flex-col h-screen-dynamic bg-[#06140F] text-white overflow-hidden">
      <Header title="nav.ai" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Quick horizontal action bar */}
      <div className="px-3 py-2 bg-[#0C1F1A] border-b border-[#1A3D2E] flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
        {TOP_QUICK_BUTTONS.map((btn, idx) => (
          <button
            key={idx}
            onClick={btn.action}
            className="px-3 py-1.5 bg-[#06140F] border border-[#1A3D2E] rounded-xl text-xs font-bold text-white whitespace-nowrap active:scale-95 transition-all hover:border-[#00A86B]"
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar smooth-scroll pb-36">
        {messages.length === 0 && (
          <div className="text-center py-8 text-[#5C7A6D] space-y-4">
            <div className="w-20 h-20 rounded-full vaqta-gradient flex items-center justify-center mx-auto shadow-2xl vaqta-glow">
              <Bot size={40} className="text-white" />
            </div>
            <div className="space-y-2 max-w-xs mx-auto">
              <p className="text-sm font-black text-white whitespace-pre-line leading-relaxed">
                {getGreeting()}
              </p>
              <p className="text-[10px] uppercase font-bold text-[#5C7A6D] tracking-widest pt-2">
                {t("chat.sub_hint")}
              </p>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="space-y-2">
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

            {/* Interactive response chips */}
            {m.role === "assistant" && m.chips && m.chips.length > 0 && (
              <div className="pl-10 flex flex-wrap gap-2 pt-1">
                {m.chips.map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => handleSend(chip.value)}
                    className="px-3 py-2 bg-[#00A86B]/15 border border-[#00A86B]/40 text-[#00A86B] hover:bg-[#00A86B] hover:text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-md"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

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

      {/* Input bar */}
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
            <button onClick={() => { setIsRecording(!isRecording); if (!isRecording) toast.info(language.startsWith("uz") ? "Овозли хабар ёзилмоқда..." : "Запись голоса..."); }} className={`p-2 transition-transform active:scale-90 ${isRecording ? "text-red-500 animate-pulse" : "text-[#5C7A6D]"}`}>
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

          <button onClick={() => handleSend()} disabled={!input.trim() && !attachedImage} className="p-2.5 bg-[#00A86B] text-white rounded-xl disabled:opacity-20 transition-all shadow-lg active:scale-95 vaqta-glow">
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