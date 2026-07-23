"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideMenu } from "@/components/SideMenu";
import { Search, MapPin, DollarSign, Home, Briefcase, ExternalLink, Loader2, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { searchRussiaJobs } from "@/services/jobs/russiaWork";
import { Job } from "@/services/jobs/types";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const QUICK_PRESETS = ["Сварщик", "Водитель", "Электрик", "Разнорабочий", "Строитель"];

export default function JobsTest() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [salaryFrom, setSalaryFrom] = useState<string>("");
  const [withHousing, setWithHousing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (overrideQuery?: string) => {
    const targetQuery = overrideQuery !== undefined ? overrideQuery : query;
    if (!targetQuery.trim()) {
      toast.warning("Введите профессию для поиска");
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await searchRussiaJobs({
        query: targetQuery.trim(),
        city: city.trim() || undefined,
        salaryFrom: salaryFrom ? Number(salaryFrom) : undefined,
        accommodation: withHousing,
        limit: 20,
      });

      setJobs(results);
      if (results.length > 0) {
        toast.success(`Найдено ${results.length} вакансий от "Работа России"`);
      } else {
        toast.info("По данному запросу вакансий не найдено");
      }
    } catch (err: any) {
      console.error(err);
      setError("Источник вакансий «Работа России» временно недоступен. Попробуйте еще раз позже.");
      toast.error("Ошибка при получении вакансий");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="Тест: Работа России" onMenuClick={() => setMenuOpen(true)} showBack />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="p-6 space-y-6">
        {/* Intro Banner */}
        <div className="vaqta-glass p-6 border-[#00A86B]/30 bg-gradient-to-br from-[#00A86B]/10 to-transparent space-y-2">
          <div className="flex items-center gap-2 text-[#00A86B]">
            <Sparkles size={18} />
            <span className="text-xs font-black uppercase tracking-wider">Открытый API «Работа России»</span>
          </div>
          <h1 className="text-xl font-black">Поиск реальных вакансий</h1>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Прямое получение вакансий из государственного реестра opendata.trudvsem.ru.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase text-[#5C7A6D] ml-1">Быстрый выбор профессии:</span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setQuery(preset);
                  handleSearch(preset);
                }}
                className="px-3 py-2 bg-[#0C1F1A] border border-[#1A3D2E] rounded-xl text-xs font-bold text-white hover:border-[#00A86B] transition-colors whitespace-nowrap"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Search Form with Filters */}
        <div className="vaqta-glass p-5 border-[#1A3D2E] space-y-3 shadow-xl">
          <div className="relative">
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00A86B]" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Введите профессию (например: Сварщик)..."
              className="w-full h-14 bg-[#06140F] border border-[#1A3D2E] rounded-2xl pl-12 pr-4 text-sm font-bold text-white focus:border-[#00A86B] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C7A6D]" size={16} />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Город / Регион"
                className="w-full h-12 bg-[#06140F] border border-[#1A3D2E] rounded-xl pl-10 pr-3 text-xs font-bold text-white outline-none focus:border-[#00A86B]"
              />
            </div>

            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C7A6D]" size={16} />
              <input
                type="number"
                value={salaryFrom}
                onChange={(e) => setSalaryFrom(e.target.value)}
                placeholder="Зарплата от (₽)"
                className="w-full h-12 bg-[#06140F] border border-[#1A3D2E] rounded-xl pl-10 pr-3 text-xs font-bold text-white outline-none focus:border-[#00A86B]"
              />
            </div>
          </div>

          {/* Housing Switch */}
          <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={withHousing}
              onChange={(e) => setWithHousing(e.target.checked)}
              className="w-4 h-4 accent-[#00A86B] rounded"
            />
            <Home size={16} className="text-[#D4AF37]" />
            <span className="text-xs font-bold text-slate-200">Предоставляется жильё / Вахта</span>
          </label>

          <button
            type="button"
            onClick={() => handleSearch()}
            disabled={loading}
            className="w-full h-14 vaqta-gradient rounded-2xl font-black text-white text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl vaqta-glow active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <><Search size={18} /> Найти работу</>}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="vaqta-glass p-5 border-red-500/30 bg-red-500/5 flex items-center gap-3 text-red-200 text-xs font-bold">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Search Results */}
        {hasSearched && !loading && !error && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-[#5C7A6D] tracking-widest">
                Результаты поиска ({jobs.length})
              </span>
              <span className="text-[10px] font-bold text-[#00A86B] uppercase flex items-center gap-1">
                <CheckCircle2 size={12} /> Live API
              </span>
            </div>

            {jobs.length === 0 ? (
              <div className="vaqta-glass p-8 border-[#1A3D2E] text-center space-y-2 text-[#5C7A6D]">
                <Briefcase size={36} className="mx-auto text-slate-600" />
                <p className="text-xs font-bold text-white">Вакансий по данному запросу не найдено</p>
                <p className="text-[10px]">Попробуйте изменить название профессии или снизить порог фильтра по зарплате.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="vaqta-glass p-5 border-[#1A3D2E] space-y-3 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="inline-block bg-[#00A86B]/10 text-[#00A86B] border border-[#00A86B]/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase mb-1">
                          Работа России
                        </span>
                        <h3 className="font-extrabold text-sm text-white leading-snug">{job.title}</h3>
                        <p className="text-[10px] text-[#5C7A6D] font-bold uppercase mt-0.5">{job.company}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-black text-[#00A86B]">{job.salary}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-[#00A86B]" />
                        <span className="truncate">{job.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={12} className="text-[#5C7A6D]" />
                        <span className="truncate">{job.schedule}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                      {job.description}
                    </p>

                    <div className="pt-1 flex items-center justify-between">
                      {job.accommodation && (
                        <span className="text-[9px] font-black uppercase text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded-lg border border-[#D4AF37]/20 flex items-center gap-1">
                          <Home size={10} /> Жильё / Вахта
                        </span>
                      )}
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto px-4 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#00A86B] hover:text-white transition-colors"
                      >
                        <span>Открыть оригинал</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}