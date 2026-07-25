"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Map } from "@/components/Map";
import { 
  Search, Navigation, Crosshair, MapPin, Bus, Car, 
  Accessibility, Bike, Home, Briefcase, Train, Plane,
  Hospital, Hotel, Loader2, Clock, X, Bookmark, Share2, ArrowRight
} from "lucide-react";
import { geocodingService } from "@/services/geocodingService";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Maps() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<[number, number]>([41.2995, 69.2401]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [travelMode, setTravelMode] = useState("car");
  const [selectedDest, setSelectedDest] = useState<any>(null);

  const handleSearch = async (val?: string) => {
    const q = val || query;
    if (!q.trim()) return;
    setLoading(true);
    try {
      const results = await geocodingService.searchAddress(q);
      if (results.length > 0) {
        const first = results[0];
        setCoords([first.latitude, first.longitude]);
        setSelectedDest(first);
        toast.success(t("common.done") || "Адрес найден");
      } else {
        toast.error(t("maps.not_found") || "Ничего не найдено");
      }
    } catch {
      toast.error(t("common.error") || "Ошибка поиска");
    } finally {
      setLoading(false);
    }
  };

  const handleLocateUser = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const up: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(up);
          setCoords(up);
          toast.success("Ваше местоположение определено");
        },
        () => {
          toast.error("Не удалось определить координаты");
        }
      );
    }
  };

  const handleClear = () => {
    setQuery("");
    setSelectedDest(null);
  };

  const MODES = [
    { id: "car", icon: Car, label: "maps.mode_car" },
    { id: "walk", icon: Accessibility, label: "maps.mode_walk" },
    { id: "bus", icon: Bus, label: "maps.mode_bus" },
    { id: "bike", icon: Bike, label: "maps.mode_bike" },
  ];

  const QUICK_POINTS = [
    { icon: Home, label: "maps.point_home", query: "дом" },
    { icon: Briefcase, label: "maps.point_work", query: "работа" },
    { icon: Train, label: "maps.point_station", query: "вокзал" },
    { icon: Plane, label: "maps.point_airport", query: "аэропорт" },
    { icon: Hospital, label: "maps.point_hospital", query: "больница" },
    { icon: Hotel, label: "maps.point_hotel", query: "отель" },
  ];

  return (
    <div className="flex flex-col h-screen-dynamic bg-[#06140F] text-white overflow-hidden relative">
      <Header title="maps.title" showBack />

      {/* Map Layer */}
      <div className="absolute inset-0 z-0 pt-16">
        <Map
          center={coords}
          zoom={15}
          userLocation={userPos}
          className="w-full h-full rounded-none"
          markers={selectedDest ? [{ id: 'dest', title: selectedDest.name, coordinates: coords }] : []}
        />
      </div>

      {/* Top Floating Control Overlay */}
      <div className="absolute top-20 left-0 right-0 px-4 z-20 space-y-3 pointer-events-none">
        {/* Search Bar */}
        <div 
          className="pointer-events-auto w-full max-w-md mx-auto rounded-2xl p-2.5 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-xl"
          style={{ background: "rgba(15, 23, 42, 0.95)" }}
        >
          <div className="pl-2 text-[#10B981] flex-shrink-0">
            <Search size={22} />
          </div>
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={t("maps.search_ph") || "Введите адрес или место..."}
            className="flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder-[#94A3B8]"
          />
          {loading && <Loader2 className="animate-spin text-[#10B981] flex-shrink-0" size={20} />}
          {query && !loading && (
            <button 
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={() => handleSearch()}
            className="px-4 py-2 bg-[#10B981] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#059669] transition-all shadow-md active:scale-95 flex-shrink-0"
          >
            Найти
          </button>
        </div>

        {/* Travel Mode Pills */}
        <div 
          className="pointer-events-auto flex gap-2 overflow-x-auto no-scrollbar py-1.5 px-3 rounded-2xl max-w-md mx-auto border border-white/10 backdrop-blur-xl shadow-lg"
          style={{ background: "rgba(10, 15, 25, 0.88)" }}
        >
          {MODES.map((m) => {
            const active = travelMode === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setTravelMode(m.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                  active 
                    ? "bg-[#10B981] text-white shadow-md font-black scale-105" 
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                <Icon size={16} />
                <span className="uppercase text-[10px] tracking-wider">{t(m.label)}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Location Category Pills */}
        <div className="pointer-events-auto flex gap-2 overflow-x-auto no-scrollbar max-w-md mx-auto">
          {QUICK_POINTS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSearch(p.query)}
              className="px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold text-slate-200 border border-white/10 backdrop-blur-md shadow-md active:scale-95 transition-all whitespace-nowrap"
              style={{ background: "rgba(10, 15, 25, 0.88)" }}
            >
              <p.icon size={14} className="text-[#10B981]" />
              <span className="text-[10px] uppercase tracking-wider">{t(p.label)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right Floating Map Control Buttons */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-3 z-20">
        <button 
          onClick={handleLocateUser}
          className="w-12 h-12 rounded-full text-white flex items-center justify-center border border-white/15 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-90 transition-all hover:border-[#10B981] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          style={{ background: "rgba(10, 15, 25, 0.88)" }}
          title="Мое местоположение"
        >
          <Crosshair size={22} className="text-[#10B981]" />
        </button>

        {selectedDest && (
          <button 
            onClick={() => {
              const [lat, lng] = coords;
              window.open(`https://www.google.com/maps/?rtext=~${lat},${lng}&rtt=auto`, "_blank");
            }}
            className="w-12 h-12 rounded-full text-white flex items-center justify-center border border-white/15 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-90 transition-all hover:border-[#10B981]"
            style={{ background: "rgba(10, 15, 25, 0.88)" }}
            title="Построить маршрут"
          >
            <Navigation size={22} className="text-[#10B981]" />
          </button>
        )}
      </div>

      {/* Bottom Result / Route Card */}
      <AnimatePresence>
        {selectedDest && (
          <motion.div 
            initial={{ y: 200, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 200, opacity: 0 }}
            className="absolute bottom-24 left-4 right-4 z-30 max-w-md mx-auto"
          >
            <div 
              className="p-5 rounded-3xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-4"
              style={{ background: "rgba(10, 15, 25, 0.95)" }}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-[#10B981]">
                    <MapPin size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t("maps.found_address") || "Адрес найден"}</span>
                  </div>
                  <h3 className="text-lg font-black text-white leading-tight">{selectedDest.name || selectedDest.display_name}</h3>
                  <p className="text-xs font-medium text-slate-400 line-clamp-2">{selectedDest.display_name}</p>
                </div>
                <button 
                  onClick={() => setSelectedDest(null)} 
                  className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400"><Clock size={18} /></div>
                  <div>
                    <p className="text-sm font-black text-white">~15 мин</p>
                    <p className="text-[9px] uppercase font-bold text-slate-400">{t("maps.time") || "В пути"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="p-2 bg-[#10B981]/20 rounded-xl text-[#10B981]"><Navigation size={18} /></div>
                  <div>
                    <p className="text-sm font-black text-white">~4.5 км</p>
                    <p className="text-[9px] uppercase font-bold text-slate-400">{t("maps.distance") || "Дистанция"}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const [lat, lng] = coords;
                    window.open(`https://www.google.com/maps/?rtext=~${lat},${lng}&rtt=auto`, "_blank");
                  }}
                  className="flex-1 py-4 bg-[#10B981] hover:bg-[#059669] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                >
                  <Navigation size={18} />
                  <span>{t("maps.route_panel.start") || "Маршрут"}</span>
                </button>

                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedDest.display_name || "");
                    toast.success("Адрес скопирован!");
                  }}
                  className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 flex items-center justify-center active:scale-95 transition-all"
                  title="Скопировать адрес"
                >
                  <Bookmark size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}