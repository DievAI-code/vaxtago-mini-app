"use client";

import { useNavigate } from "react-router-dom";
import { 
  Search, 
  TrendingUp, 
  Clock, 
  MapPin,
  ChevronRight,
  Sparkles,
  Heart,
  ShieldCheck
} from "lucide-react";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Vacancy } from "@/types/database";
import { useLanguage } from "@/context/LanguageProvider";

const CATEGORIES = [
  { name: "Сварка", icon: "👨‍🏭" },
  { name: "Вождение", icon: "🚛" },
  { name: "Стройка", icon: "🏗️" },
  { name: "Электрика", icon: "⚡" },
];

export default function Home() {
  const nav = useNavigate();
  const { t } = useLanguage();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("vacancies").select("*, employers(name, rating)").limit(4);
      if (data) setVacancies(data as Vacancy[]);
    };
    load().catch(console.error);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-40 safe-top">
      <header className="p-6 flex items-center justify-between sticky top-0 bg-[#06140F]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <VaqtaLogo size={32} />
          <h1 className="text-xl font-black tracking-tight">VAQTA AI</h1>
        </div>
        <button onClick={() => nav("/profile")} className="w-10 h-10 rounded-2xl border border-[#1A3D2E] bg-[#0C1F1A] overflow-hidden flex items-center justify-center p-0.5">
          <img src={`https://avatar.vercel.sh/vaqta-user`} alt="profile" className="w-full h-full rounded-xl" />
        </button>
      </header>

      <main className="px-6 space-y-8">
        <FadeUp>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
              <Search size={20} />
            </div>
            <input 
              type="text"
              readOnly
              placeholder={t("jobs.placeholder")}
              className="w-full bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A86B]/50 transition-all cursor-pointer"
              onClick={() => nav("/jobs")}
            />
          </div>
        </FadeUp>

        <FadeUp>
          <div 
            onClick={() => nav("/ai")}
            className="p-6 rounded-[2.5rem] vaqta-gradient relative overflow-hidden cursor-pointer group shadow-2xl vaqta-glow"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-white" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/80">{t('chat.premium_badge')}</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-4 leading-tight">{t('home.hero_title')}</h2>
              <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-widest">
                {t('home.btn_chat')} <ChevronRight size={14} />
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-700">
               <Sparkles size={180} />
            </div>
          </div>
        </FadeUp>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D] ml-2">{t('home.quick_services')}</h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map((cat) => (
              <motion.div
                key={cat.name}
                whileTap={{ scale: 0.95 }}
                onClick={() => nav("/jobs")}
                className="flex-shrink-0 p-5 w-32 vaqta-glass text-center space-y-3 cursor-pointer border-[#1A3D2E]"
              >
                <span className="text-2xl">{cat.icon}</span>
                <p className="text-[10px] font-black uppercase tracking-widest text-white">{cat.name}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[#00A86B]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D]">{t('jobs.found_count')}</h3>
            </div>
          </div>
          <div className="space-y-4">
            {vacancies.map((v) => (
              <VacancyCard key={v.id} vacancy={v} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function VacancyCard({ vacancy }: { vacancy: Vacancy }) {
  const { t } = useLanguage();
  return (
    <motion.div 
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
      whileHover={{ y: -4 }}
      className="vaqta-glass p-6 space-y-5 border-[#1A3D2E]"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h4 className="font-bold text-lg leading-tight text-white">{vacancy.title}</h4>
          <p className="text-[10px] text-[#5C7A6D] font-black uppercase tracking-widest">{vacancy.employers?.name || "Premium Partner"}</p>
        </div>
        <div className="bg-[#00A86B]/10 text-[#00A86B] p-2 rounded-xl border border-[#00A86B]/20">
          <ShieldCheck size={18} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-[#00A86B]" />
          <span>{vacancy.city}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[#00A86B]" />
          <span>Vaxta 30/30</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <span className="text-lg font-black text-[#00A86B]">{vacancy.salary_from || 0} ₽</span>
        <div className="flex gap-2">
          <button className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
            <Heart size={18} />
          </button>
          <button 
            onClick={() => window.open(vacancy.url, '_blank')}
            className="px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00A86B] hover:text-white transition-all shadow-lg"
          >
            {t('common.more')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}