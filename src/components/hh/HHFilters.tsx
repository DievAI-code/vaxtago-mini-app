"use client";

import {
  Briefcase,
  MapPin,
  Banknote,
  Search,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";

export interface HHFilterValues {
  text: string;
  city: string;
  salary: string;
  schedule: string;
  experience: string;
  employment: string;
}

interface HHFiltersProps {
  values: HHFilterValues;
  loading?: boolean;
  onChange: (values: HHFilterValues) => void;
  onSearch: () => void;
  onReset: () => void;
}

const SCHEDULES = ["fullDay", "shift", "flexible", "remote", "flyInFlyOut"] as const;
const EXPERIENCE = ["noExperience", "between1And3", "between3And6", "moreThan6"] as const;
const EMPLOYMENT = ["full", "part", "project", "probation"] as const;

const inputCls =
  "w-full h-11 bg-[#06140F] border border-[#1A3D2E] rounded-xl pl-9 pr-3 text-xs font-bold text-white outline-none focus:border-[#0AA86E] placeholder-[#5C7A6D]";
const selectCls =
  "w-full h-11 bg-[#06140F] border border-[#1A3D2E] rounded-xl px-3 text-xs font-bold text-white outline-none focus:border-[#0AA86E] appearance-none";

export function HHFilters({ values, loading, onChange, onSearch, onReset }: HHFiltersProps) {
  const { t } = useLanguage();
  const set = (patch: Partial<HHFilterValues>) => onChange({ ...values, ...patch });

  return (
    <div className="vaqta-glass p-4 border-[#1A3D2E] space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
        {t("hh.filters_title")}
      </p>

      <div className="relative">
        <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0AA86E]" />
        <input
          value={values.text}
          onChange={(e) => set({ text: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder={t("hh.search_placeholder")}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C7A6D]" />
          <input
            value={values.city}
            onChange={(e) => set({ city: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder={t("hh.city_placeholder")}
            className={inputCls}
          />
        </div>
        <div className="relative">
          <Banknote size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
          <input
            type="number"
            value={values.salary}
            onChange={(e) => set({ salary: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder={t("hh.salary_from")}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <select value={values.schedule} onChange={(e) => set({ schedule: e.target.value })} className={selectCls}>
          <option value="">
            {t("hh.schedule")}: {t("hh.any")}
          </option>
          {SCHEDULES.map((s) => (
            <option key={s} value={s}>
              {t(`hh.schedule_${s}`)}
            </option>
          ))}
        </select>
        <select value={values.experience} onChange={(e) => set({ experience: e.target.value })} className={selectCls}>
          <option value="">
            {t("hh.experience")}: {t("hh.any")}
          </option>
          {EXPERIENCE.map((s) => (
            <option key={s} value={s}>
              {t(`hh.exp_${s}`)}
            </option>
          ))}
        </select>
        <select value={values.employment} onChange={(e) => set({ employment: e.target.value })} className={selectCls}>
          <option value="">
            {t("hh.employment")}: {t("hh.any")}
          </option>
          {EMPLOYMENT.map((s) => (
            <option key={s} value={s}>
              {t(`hh.empl_${s}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          className="h-12 vaqta-gradient rounded-xl text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {t("hh.search")}
        </button>
        <button
          type="button"
          onClick={onReset}
          aria-label={t("hh.reset")}
          className="h-12 w-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-[#5C7A6D] hover:text-white active:scale-95 transition-all"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}