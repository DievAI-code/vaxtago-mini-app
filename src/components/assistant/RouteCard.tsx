"use client";

import { motion } from "framer-motion";
import { Navigation, MapPin, ArrowDown, Clock, Ruler, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageProvider";

interface RouteCardProps {
  from?: string;
  to: string;
  distance?: string;
  duration?: string;
  mode?: "car" | "walking" | "transit";
}

const MODE_ICONS = {
  car: "🚗",
  walking: "🚶",
  transit: "🚌"
};

const MODE_LABELS: Record<string, Record<string, string>> = {
  ru: { car: "На автомобиле", walking: "Пешком", transit: "Общественный транспорт" },
  uz: { car: "Avtomobil", walking: "Piyoda", transit: "Jamoat transporti" },
  en: { car: "By car", walking: "Walking", transit: "Public transport" }
};

export function RouteCard({ from, to, distance, duration, mode = "car" }: RouteCardProps) {
  const { language, t } = useLanguage();
  const nav = useNavigate();

  const handleOpenRoute = () => {
    const fromParam = from ? encodeURIComponent(from) : "";
    const toParam = encodeURIComponent(to);
    nav(`/maps?from=${fromParam}&to=${toParam}&mode=${mode}`);
  };

  const modeLabel = MODE_LABELS[language]?.[mode] || MODE_LABELS.ru[mode];
  const modeIcon = MODE_ICONS[mode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full vaqta-glass border-[#00A86B]/30 p-4 space-y-3 my-2"
    >
      <div className="flex items-center gap-2 text-[#00A86B]">
        <Navigation size={16} />
        <span className="text-xs font-black uppercase tracking-wider">
          🗺️ {t("ai.route_ready") || "Маршрут готов"}
        </span>
      </div>

      <div className="space-y-2">
        {/* From location */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00A86B]/10 flex items-center justify-center">
            <MapPin size={16} className="text-[#00A86B]" />
          </div>
          <p className="text-sm font-bold text-white truncate">
            {from || t("ai.current_location") || "Текущее местоположение"}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex items-center pl-3">
          <ArrowDown size={16} className="text-[#5C7A6D]" />
        </div>

        {/* To location */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Navigation size={16} className="text-blue-400" />
          </div>
          <p className="text-sm font-bold text-white truncate">{to}</p>
        </div>
      </div>

      {/* Route details */}
      {(distance || duration) && (
        <div className="grid grid-cols-2 gap-2 pt-2">
          {distance && (
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <Ruler size={14} className="text-[#D4AF37]" />
                <div>
                  <p className="text-xs font-black text-white">{distance}</p>
                  <p className="text-[9px] text-[#5C7A6D] uppercase">{t("maps.distance") || "Расстояние"}</p>
                </div>
              </div>
            </div>
          )}
          {duration && (
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#00A86B]" />
                <div>
                  <p className="text-xs font-black text-white">{duration}</p>
                  <p className="text-[9px] text-[#5C7A6D] uppercase">{t("maps.time") || "Время"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transport mode */}
      <div className="flex items-center gap-2 text-xs text-[#5C7A6D]">
        <span>{modeIcon}</span>
        <span>{modeLabel}</span>
      </div>

      {/* Open route button */}
      <button
        onClick={handleOpenRoute}
        className="w-full h-11 vaqta-gradient rounded-xl text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <MapPin size={16} />
        <span>{t("ai.open_route") || "Открыть маршрут"}</span>
        <ExternalLink size={14} />
      </button>
    </motion.div>
  );
}