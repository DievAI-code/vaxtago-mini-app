"use client";

import { motion } from "framer-motion";
import { MapPin, Navigation, ChevronRight, X, Car, Footprints, Bus } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { navigationService, NavigationProvider } from "@/services/navigation";
import { toast } from "sonner";

interface RouteProviderSelectorProps {
  from: string;
  to: string;
  mode?: "car" | "walking" | "transit";
  onClose?: () => void;
  onSelect?: (provider: NavigationProvider) => void;
}

export function RouteProviderSelector({
  from,
  to,
  mode = "car",
  onClose,
  onSelect,
}: RouteProviderSelectorProps) {
  const { t } = useLanguage();

  const links = navigationService.buildRoute({ from, to, mode });

  const handleSelect = (provider: NavigationProvider) => {
    onSelect?.(provider);
    try {
      navigationService.openRoute(provider, { from, to, mode });
    } catch (e) {
      console.error("[RouteProviderSelector] Failed to open route:", e);
      const link = links.find((l) => l.provider === provider);
      if (link) {
        window.open(link.url, "_blank", "noopener,noreferrer");
      }
    }
  };

  const ModeIcon = mode === "walking" ? Footprints : mode === "transit" ? Bus : Car;

  const modeLabel = {
    car: "На автомобиле",
    walking: "Пешком",
    transit: "Общественный транспорт",
  }[mode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="vaqta-glass border-[#00A86B]/30 p-5 space-y-4 shadow-2xl my-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#00A86B]">
          <Navigation size={18} />
          <span className="text-xs font-black uppercase tracking-wider">
            🗺️ Маршрут готов
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#5C7A6D] hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Route info */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00A86B]/10 flex items-center justify-center">
            <MapPin size={16} className="text-[#00A86B]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase font-black text-[#5C7A6D]">Откуда</p>
            <p className="text-sm font-bold text-white truncate">{from}</p>
          </div>
        </div>

        <div className="flex items-center pl-3">
          <div className="w-0.5 h-6 bg-gradient-to-b from-[#00A86B]/50 to-transparent" />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Navigation size={16} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase font-black text-[#5C7A6D]">Куда</p>
            <p className="text-sm font-bold text-white truncate">{to}</p>
          </div>
        </div>
      </div>

      {/* Mode badge */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
        <ModeIcon size={14} className="text-[#D4AF37]" />
        <span className="text-xs text-slate-300 font-medium">{modeLabel}</span>
      </div>

      {/* Provider buttons */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-1">
          Выберите приложение для навигации
        </p>

        {links.map((link) => (
          <motion.button
            key={link.provider}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(link.provider)}
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-[#00A86B]/40 hover:bg-[#00A86B]/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black ${
                link.provider === "yandex"
                  ? "bg-[#FFCC00]/20 text-[#FFCC00]"
                  : "bg-[#00A86B]/20 text-[#00A86B]"
              }`}>
                {link.provider === "yandex" ? "Я" : "2"}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">{link.label}</p>
                <p className="text-[10px] text-[#5C7A6D] uppercase tracking-wider">
                  {link.provider === "yandex" ? "Яндекс Карты" : "Дубль ГИС"}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#5C7A6D] group-hover:translate-x-1 transition-transform" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default RouteProviderSelector;