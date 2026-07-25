"use client";

import { motion } from "framer-motion";
import { Navigation, MapPin, ArrowDown, Clock, Ruler, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageProvider";
import { NavigationProvider } from "@/services/navigation";
import { navigationService } from "@/services/navigation";
import { resolvePOI } from "@/services/maps/poiDictionary";

interface RouteCardProps {
  from?: string;
  to: string;
  distance?: string;
  duration?: string;
  mode?: "car" | "walking" | "transit";
  city?: string;
}

export function RouteCard({
  from,
  to,
  distance,
  duration,
  mode = "car",
  city,
}: RouteCardProps) {
  const { t } = useLanguage();
  const nav = useNavigate();

  const fromValue = from || "Моё местоположение";
  const safeFrom = fromValue;
  const resolvedFrom = resolvePOI(safeFrom, city);
  const resolvedTo = resolvePOI(to, city);

  const handleOpenRoute = () => {
    try {
      const fromParam = encodeURIComponent(safeFrom);
      const toParam = encodeURIComponent(to);
      nav(`/maps?from=${fromParam}&to=${toParam}&mode=${mode}`);
    } catch (e) {
      console.error("[RouteCard] Failed to navigate:", e);
    }
  };

  const handleProviderSelect = (provider: NavigationProvider) => {
    try {
      navigationService.openRoute(provider, { from: resolvedFrom, to: resolvedTo, mode });
    } catch (e) {
      console.error("[RouteCard] Failed to open route:", e);
    }
  };

  const links = navigationService.buildRoute({
    from: resolvedFrom,
    to: resolvedTo,
    mode,
  });

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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00A86B]/10 flex items-center justify-center">
            <MapPin size={16} className="text-[#00A86B]" />
          </div>
          <p className="text-sm font-bold text-white truncate">{fromValue}</p>
        </div>

        <div className="flex items-center pl-3">
          <ArrowDown size={16} className="text-[#5C7A6D]" />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Navigation size={16} className="text-blue-400" />
          </div>
          <p className="text-sm font-bold text-white truncate">{to}</p>
        </div>
      </div>

      {(distance || duration) && (
        <div className="grid grid-cols-2 gap-2 pt-2">
          {distance && (
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <Ruler size={14} className="text-[#D4AF37]" />
                <div>
                  <p className="text-xs font-black text-white">{distance}</p>
                  <p className="text-[9px] text-[#5C7A6D] uppercase">
                    {t("maps.distance") || "Расстояние"}
                  </p>
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
                  <p className="text-[9px] text-[#5C7A6D] uppercase">
                    {t("maps.time") || "Время"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Provider selection */}
      <div className="space-y-2 pt-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-1">
          Открыть в навигаторе
        </p>
        <div className="grid grid-cols-2 gap-2">
          {links.filter(l => l.provider !== "browser").map((link) => (
            <button
              key={link.provider}
              type="button"
              onClick={() => handleProviderSelect(link.provider)}
              className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 hover:border-[#00A86B]/40 hover:bg-[#00A86B]/5 transition-all active:scale-95"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                link.provider === "yandex"
                  ? "bg-[#FFCC00]/20 text-[#FFCC00]"
                  : "bg-[#00A86B]/20 text-[#00A86B]"
              }`}>
                {link.provider === "yandex" ? "Я" : "2"}
              </div>
              <span className="text-xs font-bold text-white">{link.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleOpenRoute}
          className="w-full h-10 vaqta-gradient rounded-xl text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <MapPin size={14} />
          <span>Открыть маршрут</span>
          <ExternalLink size={12} />
        </button>
      </div>
    </motion.div>
  );
}