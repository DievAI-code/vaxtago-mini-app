"use client";

import { useEffect } from "react";
import { Loader2, Briefcase, AlertCircle, LogIn } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { useHH } from "@/hooks/useHH";
import { getHHAuthUrl, loginWithHH } from "@/services/hh/hhAuth";
import { VacancyCard } from "./VacancyCard";

interface VacancyListProps {
  query: string;
  city?: string;
  perPage?: number;
}

export function VacancyList({ query, city, perPage = 5 }: VacancyListProps) {
  const { t } = useLanguage();
  const { vacancies, loading, error, found, hasMore, authRequired, search, loadMore } = useHH();

  useEffect(() => {
    const text = [query, city].filter(Boolean).join(" ").trim();
    if (text) {
      search({ text, per_page: perPage });
    }
  }, [query, city, perPage, search]);

  const authUrl = getHHAuthUrl();

  if (loading && vacancies.length === 0) {
    return (
      <div className="w-full vaqta-glass border-[#1A3D2E] p-6 flex flex-col items-center gap-3 my-2">
        <Loader2 className="animate-spin text-[#0AA86E]" size={24} />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
          {t("hh.loading")}
        </span>
      </div>
    );
  }

  if (error && vacancies.length === 0) {
    return (
      <div className="w-full vaqta-glass border-amber-500/30 bg-amber-500/5 p-4 my-2 space-y-3">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
          <span>
            {authRequired
              ? t("hh.login_hh")
              : error === "API_NOT_CONNECTED"
              ? t("hh.api_not_connected")
              : t("hh.error")}
          </span>
        </div>
        {authRequired && authUrl && (
          <a
            href={authUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 h-10 bg-[#D5000D] text-white rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-transform"
          >
            <LogIn size={14} />
            {t("hh.login_hh")}
          </a>
        )}
      </div>
    );
  }

  if (!loading && vacancies.length === 0) {
    return (
      <div className="w-full vaqta-glass border-[#1A3D2E] p-6 flex flex-col items-center gap-2 my-2 text-center">
        <Briefcase size={28} className="text-slate-600" />
        <p className="text-xs font-bold text-white">{t("hh.empty")}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 my-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
          {t("hh.found")}: {found.toLocaleString("ru-RU")}
        </span>
        <span className="text-[9px] font-black text-[#D5000D] uppercase tracking-wider">
          hh.ru
        </span>
      </div>

      {vacancies.map((v) => (
        <VacancyCard key={v.id} vacancy={v} />
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="w-full h-11 vaqta-glass border-[#1A3D2E] rounded-2xl text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : t("hh.load_more")}
        </button>
      )}
    </div>
  );
}