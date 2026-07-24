"use client";

import { motion } from "framer-motion";
import { 
  Car, Footprints, Bus, Clock, 
  Map as MapIcon, ChevronRight, Navigation, ArrowRightLeft 
} from "lucide-react";
import { RouteResult, TravelMode } from "@/services/maps/routeService";

interface RoutePanelProps {
  route: RouteResult;
  mode: TravelMode;
  fromName: string;
  toName: string;
  onModeChange: (mode: TravelMode) => void;
  onStart: () => void;
}

export function RoutePanel({ route, mode, fromName, toName, onModeChange, onStart }: RoutePanelProps) {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }}
      className="vaqta-glass p-5 border-[#00A86B]/30 space-y-4 shadow-2xl relative overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#5C7A6D]">
            <span>От:</span>
            <span className="text-white truncate">{fromName}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#5C7A6D] mt-1">
            <span>До:</span>
            <span className="text-[#00A86B] truncate">{toName}</span>
          </div>
        </div>
        <div className="flex gap-1 ml-4">
          {(["car", "walking", "transit"] as TravelMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`p-2.5 rounded-xl transition-all ${
                mode === m ? "bg-[#00A86B] text-white shadow-lg vaqta-glow" : "bg-white/5 text-[#5C7A6D]"
              }`}
            >
              {m === "car" && <Car size={16} />}
              {m === "walking" && <Footprints size={16} />}
              {m === "transit" && <Bus size={16} />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#D4AF37]/10 rounded-xl text-[#D4AF37]"><Clock size={18} /></div>
          <div>
            <p className="text-xl font-black">{route.durationMins} мин</p>
            <p className="text-[8px] uppercase font-bold text-[#5C7A6D]">Время в пути</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00A86B]/10 rounded-xl text-[#00A86B]"><MapIcon size={18} /></div>
          <div>
            <p className="text-xl font-black">{route.distanceKm} км</p>
            <p className="text-[8px] uppercase font-bold text-[#5C7A6D]">Расстояние</p>
          </div>
        </div>
      </div>

      {route.transport && (
        <div className="bg-[#00A86B]/10 border border-[#00A86B]/20 p-3 rounded-2xl flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Bus className="text-[#00A86B]" size={20} />
              <div>
                <p className="text-xs font-black text-white">{route.transport.line}</p>
                <p className="text-[9px] font-bold text-[#00A86B] uppercase">{route.transport.stop}</p>
              </div>
           </div>
           <span className="text-[9px] font-black uppercase text-slate-400">Без пересадок</span>
        </div>
      )}

      <button 
        onClick={onStart}
        className="w-full h-14 vaqta-gradient rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-white shadow-xl vaqta-glow active:scale-95 transition-transform"
      >
        <Navigation size={18} />
        <span>Начать маршрут</span>
      </button>
    </motion.div>
  );
}