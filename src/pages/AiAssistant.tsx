"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, Paperclip, X, MapPin, Navigation, List, ExternalLink } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { useAiChat } from "@/hooks/useAiChat";
import { geocodingService, GeocodingResult } from "@/services/geocodingService";
import { MapView } from "@/components/MapView";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { toast } from "sonner";

interface LocationCardData {
  address: string;
  name?: string;
  lat: number;
  lng: number;
  options?: GeocodingResult[];
}

function isLocationIntent(text: string): boolean {
  const keywords = ["где", "адрес", "на карте", "вокзал", "мвд", "мц", "улица", "как доехать", "маршрут"];
  return keywords.some(k => text.toLowerCase().includes(k));
}

export default function AiAssistant() {
  const { t } = useLanguage();
  const { sendMessage, loading: isTyping, messages } = useAiChat();
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [locations, setLocations] = useState<Record<number, LocationCardData>>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, locations]);

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isTyping) return;
    
    const userMsg = input.trim();
    setInput("");
    const img = attachedImage;
    setAttachedImage(null);
    
    const msgIdx = messages.length;

    // Если это запрос места или маршрута
    if (isLocationIntent(userMsg) && !img) {
      const geoRes = await geocodingService.searchAddressFull(userMsg);

      if (geoRes.isRoute && geoRes.routePoints) {
        const { origin, destination } = geoRes.routePoints;
        await sendMessage(`Строю маршрут из ${origin} в ${destination}. Открываю навигатор...`);
        window.open(`https://yandex.ru/maps/?rtext=${encodeURIComponent(origin)}~${encodeURIComponent(destination)}&rtt=auto`, "_blank");
        return;
      }

      if (geoRes.results && geoRes.results.length > 0) {
        const first = geoRes.results[0];
        await sendMessage(`Нашел на карте: ${first.display_name}`);
        setLocations(prev => ({
          ...prev,
          [msgIdx + 1]: {
            address: first.display_name,
            name: first.name,
            lat: first.latitude,
            lng: first.longitude,
            options: geoRes.results.length > 1 ? geoRes.results : undefined
          }
        }));
      } else if (geoRes.error) {
        await sendMessage(geoRes.error);
      } else {
        await sendMessage(userMsg, img || undefined);
      }
    } else {
      await sendMessage(userMsg, img || undefined);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#06140F] text-white overflow-hidden">
      <Header title="nav.ai" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-48">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${m.role === "user" ? "bg-[#1A3D2E]" : "vaqta-gradient"}`}>
              {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[85%] p-4 rounded-[2rem] text-sm leading-relaxed font-medium shadow-xl flex flex-col gap-3 ${m.role === "user" ? "bg-[#00A86B] text-white rounded-tr-none" : "bg-[#0C1F1A] border border-[#1A3D2E] rounded-tl-none text-slate-100"}`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {locations[i] && (
                <div className="mt-2 space-y-3">
                  <div className="p-3 bg-[#06140F]/80 border border-[#1A3D2E] rounded-2xl">
                    <p className="text-[9px] font-black uppercase text-[#5C7A6D]">Адрес найден</p>
                    <p className="text-xs font-bold text-white">{locations[i].address}</p>
                  </div>
                  <MapView latitude={locations[i].lat} longitude={locations[i].lng} address={locations[i].address} />
                  <button onClick={() => window.open(`https://yandex.ru/maps/?rtext=~${locations[i].lat},${locations[i].lng}&rtt=auto`, "_blank")} className="w-full h-11 vaqta-gradient rounded-xl text-[10px] font-black text-white flex items-center justify-center gap-1.5 shadow-md uppercase">
                    <Navigation size={14} /> Построить маршрут
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isTyping && <div className="flex gap-3"><div className="w-9 h-9 rounded-2xl vaqta-gradient flex items-center justify-center"><Bot size={16} /></div><div className="bg-[#0C1F1A] border border-[#1A3D2E] p-4 rounded-[1.5rem] flex gap-1.5"><motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-[#00A86B] rounded-full" /><motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-[#00A86B] rounded-full" /><motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-[#00A86B] rounded-full" /></div></div>}
      </div>

      <div className="fixed bottom-24 left-0 w-full px-6 pb-2">
        <div className="relative vaqta-glass border-[#1A3D2E] focus-within:border-[#00A86B]/40 transition-all p-2 pr-4 flex items-end gap-2 shadow-2xl">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder={t("chat.placeholder")} className="flex-1 bg-transparent py-3 text-sm text-white focus:outline-none resize-none max-h-32 min-h-[48px] no-scrollbar font-medium" />
          <button onClick={handleSend} disabled={!input.trim() || isTyping} className="mb-1.5 p-3 bg-[#00A86B] text-white rounded-2xl disabled:opacity-30 transition-all shadow-lg active:scale-95"><Send size={18} /></button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}