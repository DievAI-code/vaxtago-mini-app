"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Briefcase, MapPin, DollarSign, Sparkles, Filter, ShieldCheck, Home, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideMenu } from "@/components/SideMenu";
import { jobsAggregator } from "@/services/jobsAggregator";
import { VaqtaJob } from "@/services/jobs/hh";
import { subscriptionService } from "@/services/subscriptionService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Jobs() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("query") || "");
  const [jobs, setJobs] = useState<VaqtaJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (query) handleSearch();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    const canSearch = await subscriptionService.canUse('ai'); // Using AI limit for job search
    if (!canSearch) {
      toast.error("Лимит поисков на сегодня исчерпан. Обновите до Premium!");
      return;
    }

    setLoading(true);
    try {
      const results = await jobsAggregator.search(query);
      setJobs(results);
      if (results.length === 0) toast.info("Вакансий не найдено. Попробуйте другой запрос.");
    } catch (err) {
      toast.error("Ошибка при поиске вакансий");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="nav.jobs" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="p-6 space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 text-[#00A86B] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#00A86B]/20">
            <Sparkles size={12} /> AI Job Matcher
          </div>
          <h1 className="text-2xl font-black tracking-tight">Поиск работы</h1>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 vaqta-glass border-[#1A3D2E] p-1 flex items-center focus-within:border-[#00A86B]/40 transition-all">
            <Search size={18} className="text-[#5C7A6D] ml-4" />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Сварщик, водитель, вахта..."
              className="flex-1 bg-transparent py-4 px-3 text-sm outline-none font-bold"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-4 rounded-[1.5rem] border transition-all ${showFilters ? 'bg-[#00A86B] border-[#00A86B] text-white' : 'bg-[#0C1F1A] border-[#1A3D2E] text-[#5C7A6D]'}`}
          >
            <Filter size={20} />
          </button>
        </div>

        <button 
          onClick={handleSearch}
          disabled={loading}
          className="w-full h-16 vaqta-gradient rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl vaqta-glow flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Briefcase size={18} /> Найти вакансии</>}
        </button>

        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D]">Найдено в РФ: {jobs.length}</h3>
          </div>

          <div className="space-y-4">
            {jobs.map((job, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={job.id} 
                className="vaqta-glass p-6 border-[#1A3D2E] relative overflow-hidden group hover:border-[#00A86B]/30 transition-all"
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex-1">
                    <h4 className="font-black text-lg leading-tight group-hover:text-[#00A86B] transition-colors">{job.title}</h4>
                    <p className="text-xs font-bold text-[#5C7A6D] mt-1">{job.company}</p>
                  </div>
                  <div className="bg-[#00A86B]/10 text-[#00A86B] p-2 rounded-xl border border-[#00A86B]/20">
                    <ShieldCheck size={18} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#00A86B]" />
                    <span className="truncate">{job.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-[#00A86B]" />
                    <span className="text-white">{job.salary}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      {job.housing && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded-lg border border-[#D4AF37]/20 uppercase">
                          <Home size={10} /> Жилье
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase">
                         {job.source === 'hh' ? 'HeadHunter' : 'Работа России'}
                      </div>
                   </div>
                   <button 
                    onClick={() => window.open(job.url, '_blank')}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00A86B] hover:text-white transition-all"
                   >
                     Подробнее <ChevronRight size={14} />
                   </button>
                </div>
              </motion.div>
            ))}

            {!loading && jobs.length === 0 && (
              <div className="text-center py-20 opacity-20">
                <Briefcase size={64} className="mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-sm">Начните поиск выше</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}