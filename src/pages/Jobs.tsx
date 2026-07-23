"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Briefcase, MapPin, DollarSign, Sparkles, AlertCircle, ChevronRight, Loader2, Building2, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideMenu } from "@/components/SideMenu";
import { useLanguage } from "@/context/LanguageProvider";
import { jobsAggregator } from "@/services/jobs/jobsAggregator";
import { Job } from "@/services/jobs/types";
import { subscriptionService } from "@/services/subscriptionService";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function Jobs() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("query") || "");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    if (query) handleSearch();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setErrorState(null);

    const canUse = await subscriptionService.canUse('ai'); // Reusing AI limits for job search logic
    if (!canUse) {
      toast.error("Лимит поисков на сегодня исчерпан");
      setLoading(false);
      return;
    }

    const { jobs: results, error } = await jobsAggregator.getJobs({ text: query });
    
    if (error === "API_NOT_CONNECTED") {
      setErrorState("Источник вакансий ожидает подключения API");
    } else {
      setJobs(results);
      if (results.length === 0) toast.info("Ничего не найдено");
    }
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="nav.jobs" onMenuClick={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="p-6 space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 text-[#00A86B] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#00A86B]/20">
            <Sparkles size={12} /> Smart Search
          </div>
          <h1 className="text-2xl font-black tracking-tight">{t("jobs.found_count") || "Поиск вакансий"}</h1>
        </div>

        <div className="relative vaqta-glass border-[#1A3D2E] p-1 flex items-center focus-within:border-[#00A86B]/40 transition-all">
          <Search size={18} className="text-[#5C7A6D] ml-4" />
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={t("jobs.placeholder") || "Сварщик в Москве..."}
            className="flex-1 bg-transparent py-4 px-3 text-sm outline-none font-bold"
          />
          {loading ? (
            <Loader2 className="animate-spin text-[#00A86B] mr-4" size={20} />
          ) : (
            <button onClick={handleSearch} className="p-3 bg-[#00A86B] text-white rounded-2xl mr-1 shadow-lg active:scale-95 transition-transform">
               <Search size={18} />
            </button>
          )}
        </div>

        {errorState && (
          <div className="vaqta-glass p-5 border-amber-500/30 bg-amber-500/5 flex items-start gap-4">
             <AlertCircle className="text-amber-500 flex-shrink-0" />
             <p className="text-xs font-bold text-amber-200/80 leading-relaxed">{errorState}</p>
          </div>
        )}

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {jobs.map((job, idx) => (
              <motion.div 
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="vaqta-glass p-6 border-[#1A3D2E] relative overflow-hidden group hover:border-[#00A86B]/30 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-lg leading-tight group-hover:text-[#00A86B] transition-colors">{job.title}</h3>
                    <div className="flex items-center gap-2 text-[#5C7A6D] text-[10px] font-bold uppercase mt-1">
                       <Building2 size={12} className="text-[#00A86B]" />
                       <span>{job.company}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                   <div className="bg-[#06140F] p-3 rounded-2xl border border-[#1A3D2E] space-y-1">
                      <p className="text-[8px] font-black uppercase text-[#5C7A6D]">{t("maps.found_address") || "Локация"}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <MapPin size={12} className="text-[#00A86B]" />
                        <span className="truncate">{job.city}</span>
                      </div>
                   </div>
                   <div className="bg-[#06140F] p-3 rounded-2xl border border-[#1A3D2E] space-y-1">
                      <p className="text-[8px] font-black uppercase text-[#5C7A6D]">Оплата</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-[#00A86B]">
                        <DollarSign size={12} />
                        <span>{job.salary}</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-[#5C7A6D] mb-5">
                   <Clock size={12} /> <span>{job.schedule}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => window.open(job.url, '_blank')}
                    className="h-12 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors"
                  >
                    {t("common.more")}
                  </button>
                  <button 
                    onClick={() => window.open(job.url, '_blank')}
                    className="h-12 vaqta-gradient rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg vaqta-glow"
                  >
                    Откликнуться
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && jobs.length === 0 && !errorState && (
            <div className="text-center py-20 opacity-20">
               <Briefcase size={48} className="mx-auto mb-4" />
               <p className="text-sm font-black uppercase tracking-widest">Ничего не найдено</p>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}