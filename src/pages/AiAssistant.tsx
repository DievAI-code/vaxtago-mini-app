"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User, Bot, Paperclip, X, MoreVertical, Eraser, MapPin, Navigation, Compass, Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { useAiChat } from "@/hooks/useAiChat";
import { geocodingService } from "@/services/geocodingService";
import { MapView } from "@/components/MapView";
import { toast } from "sonner";

interface LocationCardData {
  address: string;
  name?: string;
  lat: number;
  lng: number;
}

// Улучшенный парсер для определения запросов местоположения
function isLocationQuery(text: string): boolean {
  const keywords = [
    "где находится", "найди", "покажи на карте", "адрес", 
    "маршрут", "как доехать", "предприятие", "завод", 
    "компания", "организация", "мвд", "мц", "сахарово"
  ];
  const low = text.toLowerCase();
  return keywords.some(k => low.includes(k));
}

function extractLocationName(text: string): string {
  // Удаляем вспомогательные фразы для поиска чистого названия
  return text
    .replace(/(?:где находится|покажи адрес|найди компанию|покажи на карте|как доехать|найди предприятие|найди)/gi, "")
    .trim();
}

export default function AiAssistant() {
  const { t } = useLanguage();
  const { sendMessage, loading: isTyping, messages, clearHistory } = useAiChat();
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [locations, setLocations] = useState<Record<number, LocationCardData>>({});
  const [loadingGeocode, setLoadingGeocode] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, locations]);

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isTyping) return;
    
    const userMsg = input.trim();
    setInput("");
    const img = attachedImage;
    setAttachedImage(null);
    
    // Добавляем сообщение пользователя вручную в список (useAiChat обычно делает это через sendMessage, 
    // но нам нужно знать индекс для вставки карты)
    const currentMsgIndex = messages.length;

    // Если это запрос локации — пробуем геокодинг
    if (isLocationQuery(userMsg) && !img) {
      const locationName = extractLocationName(userMsg);
      setLoadingGeocode(prev => ({ ...prev, [currentMsgIndex + 1]: true }));
      
      // Сначала отправляем запрос в AI для "человечного" контекста (опционально)
      // Инструкция говорит НЕ вызывать, если это запрос локации. Мы сделаем прямой ответ.
      const geocodeResult = await geocodingService.searchAddress(locationName || userMsg);
      
      if (geocodeResult) {
        // Имитируем ответ AI с картой
        const aiReply = `Я нашел ${geocodeResult.name || 'место'} по вашему запросу. Вы можете увидеть адрес и карту ниже.`;
        
        // Перехватываем стандартный sendMessage и вызываем только для сохранения в историю
        // но здесь мы просто отобразим результат
        await sendMessage(`[LOCATION_REQUEST]: ${userMsg}`, undefined); 
        
        setLocations(prev => ({
          ...prev,
          [currentMsgIndex + 1]: {
            address: geocodeResult.display_name,
            name: geocodeResult.name,
            lat: geocodeResult.latitude,
            lng: geocodeResult.longitude
          }
        }));
      } else {
        // Если не нашли — отвечаем вежливо вместо "у меня нет интернета"
        await sendMessage(`Ничего не нашлось по запросу "${locationName || userMsg}". Попробуйте уточнить название организации или город.`, undefined);
      }
      
      setLoadingGeocode(prev => ({ ...prev, [currentMsgIndex + 1]: false }));
    } else {
      // Обычный запрос к AI
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
      <header className="p-6 border-b border-[#1A3D2E] bg-[#06140F]/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl vaqta-gradient flex items-center justify-center vaqta-glow relative">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-black tracking-tight text-lg">VAQTA AI</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
              <span className="text-[9px] font-black text-[#5C7A6D] uppercase tracking-widest">Map AI Enabled</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
           <button onClick={() => { clearHistory(); setLocations({}); }} className="p-2 text-[#5C7A6D] hover:text-red-400 transition-colors"><Eraser size={20}/></button>
           <button className="p-2 text-[#5C7A6D]"><MoreVertical size={20}/></button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-48">
        {messages.length === 0 && (
          <div className="text-center py-10 opacity-50 px-8">
            <Bot size={48} className="mx-auto mb-4 text-[#00A86B]" />
            <p className="text-sm font-bold leading-relaxed">
              Здравствуйте! Я ваш AI помощник. <br/>
              Я могу найти адрес, построить маршрут или помочь с документами.
            </p>
          </div>
        )}
        
        {messages.map((m, i) => {
          const hasLocation = locations[i];
          const isLoading = loadingGeocode[i];

          // Скрываем технические сообщения [LOCATION_REQUEST]
          if (m.content.startsWith("[LOCATION_REQUEST]")) return null;

          return (
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
              <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed font-medium shadow-xl flex flex-col gap-3 ${
                m.role === "user" 
                  ? "bg-[#00A86B] text-white rounded-tr-none" 
                  : "bg-[#0C1F1A] border border-[#1A3D2E] rounded-tl-none text-slate-100"
              }`}>
                <p className="whitespace-pre-wrap">{m.content}</p>

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-[#5C7A6D] italic mt-2">
                    <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-ping" />
                    <span>Поиск на карте VAQTA...</span>
                  </div>
                )}

                {hasLocation && (
                  <div className="mt-3 space-y-4">
                    <div className="p-4 bg-[#06140F]/60 border border-[#1A3D2E] rounded-3xl space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-[#00A86B] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-[#5C7A6D]">Адрес найден</p>
                          <p className="text-xs font-bold text-white leading-snug">{hasLocation.address}</p>
                          {hasLocation.name && <p className="text-xs text-[#D4AF37] font-bold mt-1">🏢 {hasLocation.name}</p>}
                        </div>
                      </div>
                    </div>
                    
                    <MapView latitude={hasLocation.lat} longitude={hasLocation.lng} address={hasLocation.address} />
                    
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hasLocation.lat},${hasLocation.lng}`, "_blank")}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:bg-white/10 transition-colors shadow-lg"
                    >
                      <Navigation size={14} className="text-[#D4AF37]" />
                      <span>ПОСТРОИТЬ МАРШРУТ</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        
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

      <div className="fixed bottom-28 left-0 w-full px-6 pb-4">
        {attachedImage && (
          <div className="mb-2 relative inline-block animate-in fade-in slide-in-from-bottom-2">
             <img src={attachedImage} className="w-20 h-20 object-cover rounded-2xl border-2 border-[#00A86B] shadow-2xl" alt="attachment" />
             <button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"><X size={12}/></button>
          </div>
        )}
        <div className="relative vaqta-glass overflow-hidden border-[#1A3D2E] focus-within:border-[#00A86B]/40 transition-all p-2 pr-4 flex items-end gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
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
            className="mb-1.5 p-3 bg-[#00A86B] text-white rounded-2xl disabled:opacity-30 transition-all shadow-lg hover:shadow-[#00A86B]/20 active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}