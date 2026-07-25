"use client";

import { motion } from "framer-motion";
import { Ticket, Train, Plane, Bus, ExternalLink, MapPin, Calendar } from "lucide-react";
import { TicketResult } from "@/services/tickets/types";
import { useLanguage } from "@/context/LanguageProvider";

interface TicketCardProps {
  result: TicketResult;
}

const TYPE_ICONS = {
  train: Train,
  flight: Plane,
  bus: Bus,
};

const TYPE_LABELS: Record<string, Record<string, string>> = {
  ru: { train: "Ж/Д билет", flight: "Авиабилет", bus: "Автобус" },
  uz: { train: "Темир йўл чиптаси", flight: "Авиачипта", bus: "Автобус" },
  uz_cyr: { train: "Темир йўл чиптаси", flight: "Авиачипта", bus: "Автобус" },
  en: { train: "Train Ticket", flight: "Flight", bus: "Bus" },
};

export function TicketCard({ result }: TicketCardProps) {
  const { language, t } = useLanguage();
  const TypeIcon = TYPE_ICONS[result.type];

  const typeLabel = TYPE_LABELS[language]?.[result.type] || TYPE_LABELS.ru[result.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full vaqta-glass border-[#D4AF37]/30 p-5 space-y-4 shadow-2xl my-2 overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 text-[#D4AF37]">
        <Ticket size={80} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 text-[#D4AF37] relative z-10">
        <TypeIcon size={20} />
        <span className="text-xs font-black uppercase tracking-wider">
          🎫 {typeLabel}
        </span>
      </div>

      {/* Route */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
            <MapPin size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase text-[#5C7A6D]">Откуда</p>
            <p className="text-base font-black text-white truncate">
              {result.from || "Текущее местоположение"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pl-5">
          <div className="w-0.5 h-8 bg-gradient-to-b from-[#D4AF37]/50 to-transparent rounded-full" />
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase text-[#5C7A6D]">Куда</p>
            <p className="text-base font-black text-white truncate">
              {result.to || "Уточните направление"}
            </p>
          </div>
        </div>
      </div>

      {/* Providers */}
      <div className="space-y-2 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#5C7A6D]">
          Сервисы покупки:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {result.providers.slice(0, 4).map((provider) => (
            <a
              key={provider.id}
              href={result.deepLinks.find(l => l.provider === provider.name)?.url || provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all group"
            >
              <span className="text-lg">{provider.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-[#D4AF37]">
                  {provider.name}
                </p>
                <p className="text-[9px] text-[#5C7A6D] truncate">{provider.description}</p>
              </div>
              <ExternalLink size={14} className="text-[#5C7A6D] group-hover:text-[#D4AF37]" />
            </a>
          ))}
        </div>
      </div>

      {/* Quick date selector hint */}
      <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5 relative z-10">
        <Calendar size={16} className="text-[#00A86B]" />
        <p className="text-xs text-slate-300">
          Выберите дату на сайте продавца
        </p>
      </div>
    </motion.div>
  );
}