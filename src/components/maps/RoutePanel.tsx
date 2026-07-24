"use client";

import { motion } from "framer-motion";
import { Car, personStanding as Walking, Bus, Clock, Map as MapIcon, ChevronRight } from "lucide-react";
import { RouteResult, TravelMode } from "@/services/maps/routeService";

interface RoutePanelProps {
  route: RouteResult;
  mode: TravelMode;
  onModeChange: (mode: TravelMode) => void;
  onClose: () => void;
}

export function RoutePanel({ route, mode, onModeChange, onClose }: RoutePanelProps) {
  const km = (route.distance / 1000).toFixed(1);
  const mins = Math.round(route.duration / 60);

  const MODES: { id: TravelMode; icon: any; label: string }[] = [
    { id: "driving", icon: Car, label: "Авто" },
    { id: "walking", icon: Walking, label: "Пешком" },
    { id: "transit", icon: Bus, label: "Транспорт" },
  ];

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }}
      className="vaqta-glass p-5 border-[#00A86B]/30 space-y-4 shadow-2xl relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1 min-w-[70px] transition-all ${
                mode === m.id ? "bg-[#00A86B] text-white shadow-lg vaqta-glow" : "bg-white/5 text-[#5C7A6D]"
              }`}
            >
              <m.icon size={18} />
              <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-[10px] font-black uppercase text-[#5C7A6D]">Закрыть</button>
      </div>

      <div className="flex items-center gap-6 py-2 border-y border-white/5">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#D4AF37]" />
          <div>
            <p className="text-lg font-black">{mins} мин</p>
            <p className="text-[8px] uppercase font-bold text-[#5C7A6D]">Время в пути</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapIcon size={16} className="text-[#00A86B]" />
          <div>
            <p className="text-lg font-black">{km} км</p>
            <p className="text-[8px] uppercase font-bold text-[#5C7A6D]">Расстояние</p>
          </div>
        </div>
      </div>

      <div className="max-h-32 overflow-y-auto space-y-2 no-scrollbar">
        <p className="text-[9px] font-black uppercase text-[#5C7A6D] sticky top-0 bg-[#0C1F1A]/95 py-1">Инструкции</p>
        {route.steps.map((step, i) => (
          <div key={i} className="flex gap-3 text-xs font-bold text-slate-200">
            <span className="text-[#00A86B]">{i + 1}.</span>
            <p className="leading-tight">{step}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}