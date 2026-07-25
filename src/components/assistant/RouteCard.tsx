"use client";

import { motion } from "framer-motion";
import { Navigation, MapPin, Clock, Ruler, Car, Footprints, Bus, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { routeHistory } from "@/services/routeHistory";
import { useLanguage } from "@/context/LanguageProvider";

interface RouteCardProps {
  from?: string;
  to: string;
  mode?: "car" | "walking" | "transport";
  distance?: string;
  duration?: string;
}

const MODE_ICONS = {
  car: Car,
  walking: Footprints,
  transport: Bus,
};

const MODE_LABELS: Record<string, string> = {
  car: "На автомобиле",
  walking: "Пешком",
  transport: "Общественный транспорт",
};

export function RouteCard({ from, to, mode = "car", distance, duration }: RouteCardProps) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const ModeIcon = MODE_ICONS[mode] || Car;

  const handleOpenMap = () => {
    const fromParam = from ? encodeURIComponent(from) : "";
    const toParam = encodeURIComponent(to);
    
    routeHistory.add({
      from: from || "Текущее местоположение",
      to,
      mode,
      distance,
      duration,
    });

    nav(`/maps?from=${fromParam}&to=${toParam}&mode=${mode}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full vaqta-glass border-[#00A86B]/30 p-5 space-y-4 shadow-2xl my-2 overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 text-[#00A86B]">
        <Navigation size={80} />
      </div>

      <div className="flex items-center gap-2 text-[#00A86B] relative z-10">
        <ModeIcon size={18} />
        <span className="text-xs font-black uppercase tracking-wider">
          {MODE_LABELS[mode] || "Маршрут"}
        </span>
      </div>

      <div className="space-y-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
            <MapPin size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase text-[#5C7A6D]">Откуда</p>
            <p className="text-sm font-bold text-white truncate">
              {from || "Текущее местоположение"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pl-3">
          <div className="w-0.5 h-6 bg-[#00A86B]/30 rounded-full" />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Navigation size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase text-[#5C7A6D]">Куда</p>
            <p className="text-sm font-bold text-white truncate">{to}</p>
          </div>
        </div>
      </div>

      {(distance || duration) && (
        <div className="grid grid-cols-2 gap-3 relative z-10">
          {duration && (
            <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
              <Clock size={16} className="text-[#D4AF37]" />
              <div>
                <p className="text-sm font-black text-white">{duration}</p>
                <p className="text-[9px] font-black uppercase text-[#5C7A6D]">Время</p>
              </div>
            </div>
          )}
          {distance && (
            <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
              <Ruler size={16} className="text-[#00A86B]" />
              <div>
                <p className="text-sm font-black text-white">{distance}</p>
                <p className="text-[9px] font-black uppercase text-[#5C7A6D]">Расстояние</p>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleOpenMap}
        className="w-full h-12 vaqta-gradient rounded-2xl text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg vaqta-glow active:scale-95 transition-transform relative z-10"
      >
        <MapPin size={16} />
        <span>Открыть на карте</span>
        <ExternalLink size={14} />
      </button>
    </motion.div>
  );
}