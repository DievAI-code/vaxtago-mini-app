"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Briefcase, Loader2, LogIn, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { HHFilters, type HHFilterValues } from "@/components/hh/HHFilters";
import { VacancyCard } from "@/components/hh/VacancyCard";
import { useHH } from "@/hooks/useHH";
import { useLanguage } from "@/context/LanguageProvider";
import { getHHAuthUrl, loginWithHH, parseHHCallback, verifyOAuthState, exchangeCodeForToken, isHHAuthenticated, logoutHH } from "@/services/hh/hhAuth";
import { toast } from "sonner";

const DEFAULT_FILTERS: HHFilterValues = {
  text: "",
  city: "",
  salary: "",
  schedule: "",
  experience: "",
  employment: "",
};

export default function HHJobs() {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [filters, setFilters] = useState<HHFilterValues>(DEFAULT_FILTERS);
  const [searched, setSearched] = useState(false);
  const { vacancies, loading, error, found, hasMore, authRequired, search, loadMore } = useHH();

  // Обработка OAuth callback при возврате с hh.ru
  useEffect(() => {
    const { code, state } = parseHHCallback(window.location.search);
    if (!code) return;

    if (!verifyOAuthState(state)) {
      toast.error("Ошибка безопасности OAuth. Попробуйте войти снова.");
      window.history.replaceState({}, "", "/hh");
      return;
    }

    (async () => {
      const result = await exchangeCodeForToken(code);
      if (result.success) {
        toast.success("Вы успешно вошли через HH.ru");
      } else {
        toast.error(result.error || "Ошибка входа через HH.ru");
      }
      window.history.replaceState({}, "", "/hh");
    })();
  }, []);

  const runSearch = useCallback(() => {
    const text = [filters.text, filters.city]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");
    if (!text) {
      toast.warning(t("hh.search_placeholder"));
      return;
    }
    setSearched(true);
    search({
      text,
      salary: filters.salary ? Number(filters.salary) : undefined,
      only_with_salary: Boolean(filters.salary),
      schedule: filters.schedule || undefined,
      experience: filters.experience || undefined,
      employment: filters.employment || undefined,
      per_page: 10,
    });
  }, [filters, search, t]);

  const handleReset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const authUrl = getHHAuthUrl();
  const authenticated = isHHAuthenticated();

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="hh.title" onMenuClick={() => setMenuOpen(true)} showBack />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="px-4 sm:px-5 pt-3 space-y-4 flex-1">
        <div className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {authenticated ? (
              <>
                <CheckCircle2 size={20} className="text-[#0AA86E]" />
                <div>
                  <p className="text-xs font-bold text-[#0AA86E]">Вы вошли через HH.ru</p>
                  <p className="text-[10px] text-[#5C7A6D]">Токен действителен</p>
                </div>
              </>
            ) : (
              <>
                <LogIn size={20} className="text-[#D5000D]" />
                <div>
                  <p className="text-xs font-bold text-white">Авторизация HH.ru</p>
                  <p className="text-[10px] text-[#5C7A6D]">Для доступа к API нужен вход</p>
                </div>
              </>
            )}
          </div>
          {!authenticated ? (
            <button
              onClick={loginWithHH}
              className="px-4 h-10 bg-[#D5000D] text-white rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-transform"
            >
              {t("hh.login_hh")}
            </button>
          ) : (
            <button
              onClick={() => {
                logoutHH();
                toast.info("Вы вышли из HH.ru");
              }}
              className="px-4 h-10 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-transform text-slate-300"
            >
              Выйти
            </button>
          )}
        </div>

        <HHFilters
          values={filters}
          loading={loading}
          onChange={setFilters}
          onSearch={runSearch}
          onReset={handleReset}
        />

        {searched && (
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
              {t("hh.found")}: {found.toLocaleString("ru-RU")}
            </span>
            <span className="text-[9px] font-black text-[#D5000D] uppercase tracking-wider">
              hh.ru
            </span>
          </div>
        )}

        {error && (
          <div className="vaqta-glass border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
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
        )}

        {loading && vacancies.length === 0 && (
          <div className="vaqta-glass border-[#1A3D2E] p-8 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[#0AA86E]" size={26} />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
              {t("hh.loading")}
            </span>
          </div>
        )}

        {searched && !loading && !error && vacancies.length === 0 && (
          <div className="vaqta-glass border-[#1A3D2E] p-8 flex flex-col items-center gap-2 text-center">
            <Briefcase size={30} className="text-slate-600" />
            <p className="text-xs font-bold text-white">{t("hh.empty")}</p>
          </div>
        )}

        <div className="space-y-2.5">
          {vacancies.map((v) => (
            <VacancyCard key={v.id} vacancy={v} />
          ))}
        </div>

        {hasMore && vacancies.length > 0 && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="w-full h-12 vaqta-glass border-[#1A3D2E] rounded-2xl text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : t("hh.load_more")}
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
}