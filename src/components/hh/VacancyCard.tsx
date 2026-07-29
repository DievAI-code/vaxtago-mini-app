"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Briefcase,
  GraduationCap,
  ExternalLink,
  Navigation,
  Building2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { navigationService, type NavigationProvider } from "@/services/navigation";
import type { NormalizedVacancy } from "@/services/hh/hhTypes";

interface VacancyCardProps {
  vacancy: NormalizedVacancy;
}

export function VacancyCard({ vacancy }: VacancyCardProps) {
  const { t } = useLanguage();
  const [showProviders, setShowProviders] = useState(false);

  const handleApply = () => {
    window.open(vacancy.url, "_blank", "noopener,noreferrer");
  };

  const handleRoute = (provider: NavigationProvider) => {
    const destination =
      vacancy.address || `${vacancy.city}, ${vacancy.company}`.trim();
    navigationService.openRoute(provider, {
      from: "Моё местоположение",
      to: destination,
      mode: "car",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="vaqta-glass border-[#1A3D2E] p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-white leading-snug">
            {vacancy.title}
          </h4>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 size={12} className="text-[#5C7A6D] flex-shrink-0" />
            <span className="text-[11px] font-bold text-slate-300 truncate">
              {vacancy.company}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 bg-[#0AA86E]/10 border border-[#0AA86E]/25 px-2.5 py-1.5 rounded-xl max-w-[45%]">
          <span className="text-[11px] font-black text-[#0AA86E] leading-tight block">
            {vacancy.salary || t("hh.salary_not_specified")}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400">
        <span className="flex items-center gap-1">
          <MapPin size={12} className="text-[#0AA86E]" />
          {vacancy.city}
        </span>
        {vacancy.employment && (
          <span className="flex items-center gap-1">
            <Briefcase size={12} />
            {vacancy.employment}
          </span>
        )}
        {vacancy.experience && (
          <span className="flex items-center gap-1">
            <GraduationCap size={12} />
            {vacancy.experience}
          </span>
        )}
      </div>

      {vacancy.description && (
        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
          {vacancy.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleApply}
          className="h-10 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          <ExternalLink size={13} />
          {t("hh.apply")}
        </button>
        <button
          type="button"
          onClick={() => setShowProviders(!showProviders)}
          className="h-10 vaqta-gradient text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          <Navigation size={13} />
          {t("hh.route")}
        </button>
      </div>

      {showProviders && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="grid grid-cols-2 gap-2"
        >
          <button
            type="button"
            onClick={() => handleRoute("2gis")}
            className="h-9 bg-[#00A86B]/15 border border-[#00A86B]/30 rounded-xl text-[10px] font-black text-[#00A86B] uppercase tracking-wider active:scale-95 transition-transform"
          >
            🟢 2ГИС
          </button>
          <button
            type="button"
            onClick={() => handleRoute("yandex")}
            className="h-9 bg-[#FFCC00]/15 border border-[#FFCC00]/30 rounded-xl text-[10px] font-black text-[#FFCC00] uppercase tracking-wider active:scale-95 transition-transform"
          >
            🟡 Яндекс
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}