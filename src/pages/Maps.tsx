"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Map } from "@/components/Map";
import { 
  Search, Navigation, Crosshair, MapPin, Bus, Car, 
  Footprints, Bike, Taxi, Home, Briefcase, Train, Plane,
  Hospital, Hotel, Utensils, Fuel, Banknote, Loader2,
  Clock, Ruler, ArrowRight
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
        toast.success(t("common.done"));
      } else {
        toast.error(t("maps.not_found"));
      }
    } finally {
      setLoading(false);
    }
  };

  const MODES = [
    { id: "car", icon: Car, label: "maps.mode_car" },
    { id: "walk", icon: Footprints, label: "maps.mode_walk" },
    { id: "bus", icon: Bus, label: "maps.mode_bus" },
    { id: "taxi", icon: Taxi, label: "maps.mode_taxi" },
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

      <div className="absolute inset-0 z-0 pt-16">
        <Map
          center={coords}
          zoom={15}
          userLocation={userPos}
          className="w-full h-full rounded-none"
          markers={selectedDest ? [{ id: 'dest', title: selectedDest.name, coordinates: coords }] : []}
        />
      </div>

      {/* Top Controller */}
      <div className="absolute top-24 left-0 right-0 px-6 z-10 space-y-4">
        <div className="liquid-glass p-2 rounded-[2rem] flex items-center gap-3 shadow-2xl">
           <div className="p-3 text-[#0AA86E]"><Search size={22} /></div>
           <input 
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             onKeyDown={(e) => e.key === "Enter" && handleSearch()}
             placeholder={t("maps.search_ph")}
             className="flex-1 bg-transparent py-4 text-sm font-bold text-white outline-none"
           />
           {loading && <Loader2 className="animate-spin text-[#0AA86E] mr-4" size={20} />}
        </div>

        {/* Transport Modes */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setTravelMode(m.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 border",
                travelMode === m.id 
                  ? "bg-white text-black border-white shadow-xl scale-105" 
                  : "liquid-glass border-white/5 text-slate-400"
              )}
            >
              <m.icon size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">{t(m.label)}</span>
            </button>
          ))}
        </div>

        {/* Quick Points */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_POINTS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSearch(p.query)}
              className="liquid-glass px-4 py-2.5 rounded-full flex items-center gap-2 active:scale-95"
            >
              <p.icon size={14} className="text-[#0AA86E]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{t(p.label)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Controls */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-3 z-10">
        <button className="p-4 liquid-glass rounded-2xl text-[#0AA86E] shadow-2xl active:scale-90 transition-all">
          <Crosshair size={24} />
        </button>
      </div>

      {/* Route Detail Panel */}
      <AnimatePresence>
        {selectedDest && (
          <motion.div 
            initial={{ y: 200 }} 
            animate={{ y: 0 }} 
            exit={{ y: 200 }}
            className="absolute bottom-28 left-4 right-4 z-20"
          >
            <div className="liquid-glass p-6 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-white/10 space-y-6">
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl text-white normal-case leading-tight">{selectedDest.name}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{selectedDest.address}</p>
                  </div>
                  <button onClick={() => setSelectedDest(null)} className="text-white/20 p-1">
                    <ArrowRight className="rotate-45" />
                  </button>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500"><Clock size={20} /></div>
                     <div>
                        <p className="text-lg font-black">12 мин</p>
                        <p className="text-[8px] uppercase font-bold text-slate-500">{t("maps.route_panel.time")}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-[#0AA86E]/10 rounded-xl text-[#0AA86E]"><Navigation size={20} /></div>
                     <div>
                        <p className="text-lg font-black">4.2 км</p>
                        <p className="text-[8px] uppercase font-bold text-slate-500">{t("maps.route_panel.dist")}</p>
                     </div>
                  </div>
               </div>

               <button className="w-full py-5 bg-[#0AA86E] text-white rounded-[1.8rem] font-black uppercase tracking-widest shadow-2xl vaqta-glow active:scale-95 transition-all">
                 {t("maps.route_panel.start")}
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}