"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Briefcase, MapPin, DollarSign, Sparkles, Filter, ShieldCheck, Home, CheckCircle2, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideMenu } from "@/components/SideMenu";
import { jobsAggregator } from "@/services/jobsAggregator";
import { VaqtaJob } from "@/services/jobsAggregator";
import { subscriptionService } from "@/services/subscriptionService";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Jobs() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("query") || "");
  const [jobs, setJobs] = useState<VaqtaJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => { if (query) handleSearch(); }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setErrorState(null);

    const canSearch = await subscriptionService.canUse('ai');
    if (!canSearch) {
      toast.error("Лимит поисков исчерпан. Обновите до Premium!");
      return;
    }

    setLoading(true);
    try {
      const results = await jobsAggregator.search(query);
      setJobs(results);
    } catch (err: any) {
      if (err.message.includes("NOT_CONNECTED")) {
        setErrorState("Источник вакансий не подключен. Пожалуйста, обратитесь к администратору для настройки API ключей.");
      } else {
        toast.error("Ошибка при поиске вакансий");
      }
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

        <div className="relative vaqta-glass border-[#1A3D2E] p-1 flex items-center">
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
          onClick={handleSearch}
          disabled={loading}
          className="w-full h-16 vaqta-gradient rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl vaqta-glow flex items-center justify-center gap-3 active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Briefcase size={18} /> Найти вакансии</>}
        </button>

        {errorState && (
          <div className="vaqta-glass p-5 border-amber-500/30 bg-amber-500/5 flex items-start gap-4">
             <AlertCircle className="text-amber-500 flex-shrink-0" />
             <p className="text-xs font-bold text-amber-200/80 leading-relaxed">{errorState}</p>
          </div>
        )}

        <section className="space-y-4 pt-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D]">Найдено: {jobs.length}</h3>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="vaqta-glass p-6 border-[#1A3D2E]">
                <h4 className="font-black text-lg">{job.title}</h4>
                <p className="text-xs font-bold text-[#5C7A6D] mt-1">{job.company}</p>
                <div className="flex gap-4 mt-4 text-[10px] font-black uppercase text-[#5C7A6D]">
                  <span className="flex items-center gap-1"><MapPin size={12} className="text-[#00A86B]" /> {job.city}</span>
                  <span className="flex items-center gap-1"><DollarSign size={12} className="text-[#00A86B]" /> {job.salary}</span>
                </div>
                <button onClick={() => window.open(job.url, '_blank')} className="w-full mt-4 h-12 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest">
                  Подробнее
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}