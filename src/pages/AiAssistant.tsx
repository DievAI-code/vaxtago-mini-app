"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, X, ImageIcon, Camera, MapPin } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { useAiChat } from "@/hooks/useAiChat";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { MapCard } from "@/components/MapCard";
import { toast } from "sonner";
import { subscriptionService } from "@/services/subscriptionService";

export default function AiAssistant() {
  const { t } = useLanguage();
  const { sendMessage, loading: isTyping, messages } = useAiChat();
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isTyping) return;

    const userMsg = input.trim();
    const isMapRequest = /карта|адрес|доехать|маршрут|где находится/i.test(userMsg);
    
    // Проверка лимитов для карт
    if (isMapRequest) {
      const canUseMap = await subscriptionService.canUse("map");
      if (!canUseMap) {
        toast.error("Дневной лимит карт (5/5) исчерпан. Подключите Premium.");
        return;
      }
    }

    const canUseAI = await subscriptionService.canUse("ai");
    if (!canUseAI) {
      toast.error(t("premium.feature_locked") || "Лимит AI исчерпан");
      return;
    }

    setInput("");
    const img = attachedImage;
    setAttachedImage(null);

    await sendMessage(userMsg, img || undefined);
    
    await subscriptionService.trackUsage("ai");
    if (isMapRequest) await subscriptionService.trackUsage("map");
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setAttachedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-screen bg-[#06140F] text-white overflow-hidden">
      <Header title="nav.ai" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-48">
        {messages.length === 0 && (
          <div className="text-center py-12 text-[#5C7A6D] space-y-3">
            <Bot size={56} className="mx-auto text-[#00A86B] opacity-50" />
            <div className="space-y-1">
              <p className="text-sm font-black text-white uppercase tracking-widest">{t("chat.welcome")}</p>
              <p className="text-[10px] uppercase font-bold leading-relaxed px-8">Задайте вопрос, сфотографируйте документ или постройте маршрут</p>
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          // Эвристика определения адреса или маршрута в ответе ассистента
          const addressMatch = m.content.match(/(?:адрес|местоположение|находится по адресу):\s*([^.]+)/i);
          const isRoute = /маршрут|путь|доехать/i.test(m.content) && addressMatch;
          
          return (
            <div key={i} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${
                    m.role === "user" ? "bg-[#1A3D2E]" : "vaqta-gradient"
                  }`}
                >
                  {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div
                  className={`max-w-[85%] p-4 rounded-[1.8rem] text-sm leading-relaxed font-medium shadow-xl flex flex-col gap-3 ${
                    m.role === "user"
                      ? "bg-[#00A86B] text-white rounded-tr-none"
                      : "bg-[#0C1F1A] border border-[#1A3D2E] rounded-tl-none text-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </motion.div>

              {/* Рендеринг карты если найден адрес */}
              {addressMatch && (
                <div className={`${m.role === "assistant" ? "pl-12" : "pr-12"}`}>
                   <MapCard 
                     address={addressMatch[1].trim()} 
                     type={isRoute ? "route" : "search"} 
                     title="Место на карте"
                   />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-2xl vaqta-gradient flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-[#0C1F1A] border border-[#1A3D2E] p-4 rounded-[1.5rem] flex gap-1.5 items-center">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-[#00A86B] rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#00A86B] rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#00A86B] rounded-full" />
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-24 left-0 w-full px-6 pb-2">
        <AnimatePresence>
          {attachedImage && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="relative mb-3 inline-block">
              <img src={attachedImage} alt="Attached" className="w-24 h-24 rounded-3xl object-cover border-2 border-[#00A86B] shadow-2xl" />
              <button
                onClick={() => setAttachedImage(null)}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-[#06140F] shadow-lg"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative vaqta-glass border-[#1A3D2E] focus-within:border-[#00A86B]/40 transition-all p-2 pr-4 flex items-end gap-2 shadow-2xl">
          <div className="flex gap-1">
            <button onClick={() => fileRef.current?.click()} className="p-2.5 text-[#5C7A6D] hover:text-[#00A86B] active:scale-90 transition-transform">
              <ImageIcon size={22} />
            </button>
            <button onClick={() => cameraRef.current?.click()} className="p-2.5 text-[#5C7A6D] hover:text-[#00A86B] active:scale-90 transition-transform">
              <Camera size={22} />
            </button>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={t("chat.placeholder")}
            className="flex-1 bg-transparent py-3 text-sm text-white focus:outline-none resize-none max-h-32 min-h-[48px] no-scrollbar font-medium"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() && !attachedImage}
            className="mb-1.5 p-3 bg-[#00A86B] text-white rounded-2xl disabled:opacity-20 transition-all shadow-lg active:scale-95 vaqta-glow"
          >
            <Send size={20} />
          </button>
        </div>
        
        <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
        <input type="file" ref={cameraRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
      </div>

      <BottomNav />
    </div>
  );
}