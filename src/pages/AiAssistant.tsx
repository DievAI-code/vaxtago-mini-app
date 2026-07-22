"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User, Bot, Paperclip, X, MoreVertical, Eraser, MapPin, Navigation, List, Languages, Info, ExternalLink } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { useAiChat } from "@/hooks/useAiChat";
import { geocodingService, GeocodingResult } from "@/services/geocodingService";
import { MapView } from "@/components/MapView";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";

interface LocationCardData {
  address: string;
  name?: string;
  lat: number;
  lng: number;
  options?: GeocodingResult[];
}

function isLocationQuery(text: string): boolean {
  const keywords = [
    "где находится", "найди", "покажи на карте", "адрес", 
    "маршрут", "как доехать", "предприятие", "завод", 
    "компания", "организация", "мвд", "мц", "сахарово",
    "вокзал", "аэропорт", "больница", "рынок", "офис", "автовокзал",
    "улица", "проспект", "переулок", "корпус", "дом"
  ];
  const low = text.toLowerCase();
  
  // Direct matching or street number patterns (e.g. "карнацевича 1 к 1", "ленина 25")
  const hasStreetNumber = /\b[а-яa-z]+\s+\d+\s*(к|корп|корпус|\/)?\s*\d*\b/i.test(low);
  return keywords.some(k => low.includes(k)) || hasStreetNumber;
}

export default function AiAssistant() {
  const { t } = useLanguage();
  const { sendMessage, loading: isTyping, messages, clearHistory } = useAiChat();
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [locations, setLocations] = useState<Record<number, LocationCardData>>({});
  const [loadingGeocode, setLoadingGeocode] = useState<Record<number, boolean>>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, locations]);

  const selectLocation = (msgIndex: number, result: GeocodingResult) => {
    setLocations(prev => ({
      ...prev,
      [msgIndex]: {
        address: result.display_name,
        name: result.name,
        lat: result.latitude,
        lng: result.longitude
      }
    }));

    try {
      const existing = JSON.parse(localStorage.getItem("vaqta_places_history") || "[]");
      const updated = [{ name: result.name || "Объект", address: result.display_name, lat: result.latitude, lng: result.longitude, date: new Date().toISOString() }, ...existing].slice(0, 10);
      localStorage.setItem("vaqta_places_history", JSON.stringify(updated));
    } catch {}
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isTyping) return;
    
    const userMsg = input.trim();
    setInput("");
    const img = attachedImage;
    setAttachedImage(null);
    
    const currentMsgIndex = messages.length;

    if (isLocationQuery(userMsg) && !img) {
      setLoadingGeocode(prev => ({ ...prev, [currentMsgIndex + 1]: true }));
      
      const geocodeRes = await geocodingService.searchAddressFull(userMsg);
      const results = geocodeRes.results;
      
      if (results && results.length > 0) {
        const first = results[0];
        await sendMessage(`Нашел адрес: ${first.display_name}. Показываю на карте.`);
        selectLocation(currentMsgIndex + 1, first);
      } else {
        await sendMessage(`Я не смог найти этот адрес. Уточните город (например, Тюмень, ${userMsg}).`);
      }
      
      setLoadingGeocode(prev => ({ ...prev, [currentMsgIndex + 1]: false }));
    } else {
      await sendMessage(userMsg, img || undefined);
    }
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
    <div className="flex flex-col h-screen bg-[#06140F] text-white overflow-hidden">
      <Header title="nav.ai" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-48">
        {messages.length === 0 && (
          <div className="text-center py-12 px-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl vaqta-gradient flex items-center justify-center mx-auto shadow-2xl vaqta-glow">
              <Bot size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">VAQTA AI Assistant</h2>
              <p className="text-xs text-[#5C7A6D] font-medium leading-relaxed max-w-xs mx-auto mt-2">
                Задайте любой вопрос. Я знаю законы, адреса, патенты, перевод с узбекского/таджикского и могу проверить работодателя.
              </p>
            </div>
          </div>
        )}
        
        {messages.map((m, i) => {
          const loc = locations[i];
          const isLoading = loadingGeocode[i];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${
                m.role === "user" ? "bg-[#1A3D2E]" : "vaqta-gradient"
              }`}>
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[85%] p-4 rounded-[2rem] text-sm leading-relaxed font-medium shadow-xl flex flex-col gap-3 ${
                m.role === "user" 
                  ? "bg-[#00A86B] text-white rounded-tr-none" 
                  : "bg-[#0C1F1A] border border-[#1A3D2E] rounded-tl-none text-slate-100"
              }`}>
                <p className="whitespace-pre-wrap">{m.content}</p>

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-[#5C7A6D] italic mt-2">
                    <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-ping" />
                    <span>Поиск на карте Яндекс / OSM...</span>
                  </div>
                )}

                {loc && (
                  <div className="mt-2 space-y-3">
                    {!loc.options ? (
                      <>
                        <div className="p-3 bg-[#06140F]/80 border border-[#1A3D2E] rounded-2xl space-y-1">
                          <div className="flex items-start gap-2">
                            <MapPin size={16} className="text-[#00A86B] flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[9px] font-black uppercase text-[#5C7A6D]">Точный адрес</p>
                              <p className="text-xs font-bold text-white leading-snug">{loc.address}</p>
                              {loc.name && <p className="text-xs text-[#D4AF37] font-bold mt-1">🏢 {loc.name}</p>}
                            </div>
                          </div>
                        </div>
                        
                        <MapView latitude={loc.lat} longitude={loc.lng} address={loc.address} />
                        
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => window.open(`https://yandex.ru/maps/?rtext=~${loc.lat},${loc.lng}&rtt=auto`, "_blank")}
                            className="h-11 vaqta-gradient rounded-xl text-[10px] font-black text-white flex items-center justify-center gap-1.5 shadow-md uppercase"
                          >
                            <Navigation size={14} />
                            <span>Маршрут</span>
                          </button>
                          <button
                            onClick={() => window.open(`https://yandex.ru/maps/?text=${encodeURIComponent(loc.address)}`, "_blank")}
                            className="h-11 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors uppercase"
                          >
                            <ExternalLink size={14} className="text-[#00A86B]" />
                            <span>Яндекс Карты</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                           <List size={14} className="text-[#00A86B]"/>
                           <span className="text-[10px] font-black uppercase text-[#5C7A6D]">Выберите нужное место:</span>
                        </div>
                        {loc.options.map((opt, idx) => (
                          <button 
                            key={idx}
                            onClick={() => selectLocation(i, opt)}
                            className="w-full text-left p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-[#00A86B]/10 hover:border-[#00A86B]/30 transition-all group"
                          >
                            <p className="text-xs font-bold text-white truncate">{opt.name}</p>
                            <p className="text-[9px] text-[#5C7A6D] truncate mt-0.5">{opt.display_name}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-2xl vaqta-gradient flex items-center justify-center"><Bot size={16} /></div>
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

      {/* Input panel */}
      <div className="fixed bottom-24 left-0 w-full px-6 pb-2">
        {attachedImage && (
          <div className="mb-2 relative inline-block animate-in fade-in slide-in-from-bottom-2">
             <img src={attachedImage} className="w-20 h-20 object-cover rounded-2xl border-2 border-[#00A86B] shadow-2xl" alt="attachment" />
             <button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"><X size={12}/></button>
          </div>
        )}
        <div className="relative vaqta-glass overflow-hidden border-[#1A3D2E] focus-within:border-[#00A86B]/40 transition-all p-2 pr-4 flex items-end gap-2 shadow-2xl">
          <div className="flex gap-1 mb-2">
            <button onClick={() => fileRef.current?.click()} className="p-2.5 text-[#5C7A6D] hover:text-[#00A86B] transition-colors"><Paperclip size={20}/></button>
            <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={onFileChange} />
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
            disabled={(!input.trim() && !attachedImage) || isTyping}
            className="mb-1.5 p-3 bg-[#00A86B] text-white rounded-2xl disabled:opacity-30 transition-all shadow-lg active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}