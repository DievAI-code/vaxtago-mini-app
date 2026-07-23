"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Briefcase, MapPin, DollarSign, Sparkles, Building2, Clock, ExternalLink, Globe2 } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideMenu } from "@/components/SideMenu";
import { useLanguage } from "@/context/LanguageProvider";
import { jobsAggregator } from "@/services/jobs/jobsAggregator";
import { Job } from "@/services/jobs/types";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function Jobs() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("query") || "");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (query) handleSearch();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    
    const { jobs: results } = await jobsAggregator.getJobs({ text: query });
    setJobs(results);
    
    if (results.length === 0) {
      toast.info("Ничего не найдено в данный момент");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="nav.jobs" onMenuClick={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="p-6 space-y-6">
        <div className="relative vaqta-glass border-[#1A3D2E] p-1 flex items-center focus-within:border-[#00A86B]/40 transition-all">
          <Search size={18} className="text-[#5C7A6D] ml-4" />
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Профессия или город..."
            className="flex-1 bg-transparent py-4 px-3 text-sm outline-none font-bold"
          />
          <button onClick={handleSearch} className="p-3 bg-[#00A86B] text-white rounded-2xl mr-1 shadow-lg active:scale-95">
             <Search size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {jobs.map((job, idx) => (
              <motion.div 
                key={job.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="vaqta-glass p-6 border-[#1A3D2E] relative overflow-hidden group hover:border-[#00A86B]/30"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${job.source === 'hh' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                         {job.source === 'hh' ? 'HeadHunter' : 'Работа России'}
                       </span>
                    </div>
                    <h3 className="font-black text-lg leading-tight">{job.title}</h3>
                    <p className="text-xs font-bold text-[#5C7A6D] mt-1 flex items-center gap-1">
                       <Building2 size={12} /> {job.company}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                   <div className="bg-[#06140F] p-3 rounded-2xl border border-[#1A3D2E]">
                      <p className="text-[8px] font-black uppercase text-[#5C7A6D]">Оплата</p>
                      <p className="text-[10px] font-black text-[#00A86B] truncate">{job.salary}</p>
                   </div>
                   <div className="bg-[#06140F] p-3 rounded-2xl border border-[#1A3D2E]">
                      <p className="text-[8px] font-black uppercase text-[#5C7A6D]">Локация</p>
                      <p className="text-[10px] font-bold text-slate-200 truncate">{job.city}</p>
                   </div>
                </div>

                <div className="flex items-center gap-4 text-[9px] font-black uppercase text-[#5C7A6D] mb-5">
                   <div className="flex items-center gap-1.5"><Clock size={12} /> {job.schedule}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => window.open(job.url, '_blank')} className="h-12 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10">
                    Подробнее
                  </button>
                  <button onClick={() => window.open(job.url, '_blank')} className="h-12 vaqta-gradient rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">
                    Откликнуться
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
               <div className="w-10 h-10 border-2 border-[#00A86B]/20 border-t-[#00A86B] animate-spin rounded-full" />
               <p className="text-[10px] font-black uppercase text-[#00A86B] animate-pulse">Агрегация вакансий...</p>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}