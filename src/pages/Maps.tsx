"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Map } from "@/components/Map";
import { GlassCard } from "@/components/ui/GlassCard";
import { Search, Navigation, Crosshair, MapPin, Bus, Car, Loader2 } from "lucide-react";
import { geocodingService } from "@/services/geocodingService";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";

export default function Maps() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<[number, number]>([41.2995, 69.2401]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const results = await geocodingService.searchAddress(query);
      if (results.length > 0) {
        setCoords([results[0].latitude, results[0].longitude]);
        toast.success("Место найдено");
      } else {
        toast.error("Ничего не найдено");
      }
    } finally {
      setLoading(false);
    }
  };

  const locateUser = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const up: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(up);
        setCoords(up);
        toast.success("Местоположение определено");
      });
    }
  };

  return (
    <div className="flex flex-col h-screen-dynamic bg-[#06140F] text-white overflow-hidden relative">
      <Header title="nav.map" showBack />

      <div className="absolute inset-0 z-0 pt-16">
        <Map
          center={coords}
          zoom={14}
          userLocation={userPos}
          className="w-full h-full rounded-none"
          markers={userPos ? [{ id: 'user', title: 'Я', coordinates: userPos }] : []}
        />
      </div>

      {/* Floating Controls */}
      <div className="absolute top-24 right-4 flex flex-col gap-3 z-10">
        <button onClick={locateUser} className="p-4 liquid-glass rounded-2xl text-[#00A86B] shadow-2xl active:scale-90 transition-all">
          <Crosshair size={22} />
        </button>
      </div>

      {/* Bottom Control Sheet */}
      <div className="absolute bottom-24 left-0 right-0 px-4 z-20">
        <GlassCard className="p-4 rounded-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-white/5 space-y-4">
          <div className="flex items-center gap-3 liquid-glass !bg-white/5 px-4 py-1.5 rounded-2xl border-none">
             <Search size={18} className="text-[#5C7A6D]" />
             <input 
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && handleSearch()}
               placeholder={t("maps.search_ph") || "Поиск адреса..."}
               className="flex-1 bg-transparent py-3 text-sm font-bold text-white outline-none"
             />
             {loading ? <Loader2 className="animate-spin text-[#00A86B]" size={18} /> : (
               <button onClick={handleSearch} className="text-[#00A86B] font-black text-xs uppercase tracking-widest">Найти</button>
             )}
          </div>

          <div className="grid grid-cols-3 gap-2">
             <button className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-[#00A86B]/30 transition-all">
                <Navigation size={20} className="text-[#00A86B]" />
                <span className="text-[9px] font-black uppercase tracking-wider">Маршрут</span>
             </button>
             <button className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all">
                <Car size={20} className="text-blue-500" />
                <span className="text-[9px] font-black uppercase tracking-wider">Такси</span>
             </button>
             <button className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all">
                <Bus size={20} className="text-purple-500" />
                <span className="text-[9px] font-black uppercase tracking-wider">Автобус</span>
             </button>
          </div>
        </GlassCard>
      </div>

      <BottomNav />
    </div>
  );
}