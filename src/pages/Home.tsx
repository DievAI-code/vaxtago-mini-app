"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Briefcase, 
  Zap, 
  TrendingUp, 
  Clock, 
  Star,
  MapPin,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp, stagger, fadeUp } from "@/components/animations";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  { name: "Сварка", icon: "👨‍🏭", count: 124 },
  { name: "Вождение", icon: "🚛", count: 86 },
  { name: "Стройка", icon: "🏗️", count: 210 },
  { name: "Электрика", icon: "⚡", count: 45 },
];

export default function Home() {
  const nav = useNavigate();
  const [vacancies, setVacancies] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("vacancies").select("*, employers(name, rating)").limit(4);
      if (data) setVacancies(data);
    };
    load();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] pb-32">
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-[#09090B]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <VaxtaGoLogo size={32} />
          <h1 className="text-xl font-bold tracking-tight">VaxtaGo</h1>
        </div>
        <button onClick={() => nav("/profile")} className="w-10 h-10 rounded-full border border-white/10 overflow-hidden">
          <img src="https://avatar.vercel.sh/user" alt="profile" />
        </button>
      </header>

      <main className="px-6 space-y-8">
        {/* Search Bar */}
        <FadeUp>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
              <Search size={20} />
            </div>
            <input 
              type="text"
              placeholder="Поиск вакансий..."
              className="w-full bg-[#18181B] border border-[#27272A] rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 transition-all"
              onFocus={() => nav("/jobs")}
            />
          </div>
        </FadeUp>

        {/* AI Recommendations Banner */}
        <FadeUp>
          <div 
            onClick={() => nav("/ai")}
            className="p-6 rounded-[2rem] vg-gradient relative overflow-hidden cursor-pointer group"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-white" />
                <span className="text-sm font-semibold uppercase tracking-wider text-white/80">AI Рекомендации</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Найти работу <br />по вашему опыту</h2>
              <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                Спросить ассистента <ChevronRight size={16} />
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
              <Sparkles size={120} />
            </div>
          </div>
        </FadeUp>

        {/* Categories */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Категории</h3>
            <button className="text-sm text-slate-500 hover:text-white transition-colors">Все</button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map((cat) => (
              <motion.div
                key={cat.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 p-4 w-32 glass-card text-center space-y-2 cursor-pointer"
              >
                <span className="text-2xl">{cat.icon}</span>
                <p className="text-sm font-semibold">{cat.name}</p>
                <p className="text-[10px] text-slate-500">{cat.count} вакансий</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Popular Vacancies */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-[#2563EB]" />
              <h3 className="text-lg font-bold">Популярные</h3>
            </div>
          </div>
          <div className="space-y-4">
            {vacancies.map((v: any) => (
              <VacancyCard key={v.id} vacancy={v} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function VacancyCard({ vacancy }: { vacancy: any }) {
  const nav = useNavigate();
  return (
    <motion.div 
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className="glass-card p-5 space-y-4"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h4 className="font-bold text-lg leading-tight">{vacancy.title}</h4>
          <p className="text-sm text-slate-400 font-medium">{vacancy.employers?.name}</p>
        </div>
        <div className="bg-[#2563EB]/10 text-[#2563EB] p-2 rounded-xl">
          <Zap size={18} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <MapPin size={14} />
          <span>{vacancy.city}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Clock size={14} />
          <span>Вахта 30/30</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-lg font-bold text-[#22C55E]">от {vacancy.salary_from} ₽</span>
        <div className="flex gap-2">
          <button className="p-2 rounded-xl border border-[#27272A] text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <Heart size={18} />
          </button>
          <button 
            onClick={() => window.open(vacancy.url, '_blank')}
            className="px-4 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            Подробнее
          </button>
        </div>
      </div>
    </motion.div>
  );
}