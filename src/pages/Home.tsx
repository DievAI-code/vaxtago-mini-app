"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Zap, 
  TrendingUp, 
  Clock, 
  MapPin,
  ChevronRight,
  Sparkles,
  Heart
} from "lucide-react";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Vacancy } from "@/types/database";

const CATEGORIES = [
  { name: "Сварка", icon: "👨‍🏭", count: 124 },
  { name: "Вождение", icon: "🚛", count: 86 },
  { name: "Стройка", icon: "🏗️", count: 210 },
  { name: "Электрика", icon: "⚡", count: 45 },
];

export default function Home() {
  const nav = useNavigate();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("vacancies").select("*, employers(name, rating)").limit(4);
      if (data) setVacancies(data as Vacancy[]);
    };
    load().catch(console.error);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6 flex items-center justify-between sticky top-0 bg-[#06140F]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <VaqtaLogo size={32} />
          <h1 className="text-xl font-bold tracking-tight">VAQTA AI</h1>
        </div>
        <button onClick={() => nav("/profile")} className="w-10 h-10 rounded-full border border-white/10 overflow-hidden">
          <img src="https://avatar.vercel.sh/user" alt="profile" />
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
              placeholder="Ish qidirish..."
              className="w-full bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A86B]/50 transition-all"
              onFocus={() => nav("/jobs")}
            />
          </div>
        </FadeUp>

        <FadeUp>
          <div 
            onClick={() => nav("/ai")}
            className="p-6 rounded-[2rem] vaqta-gradient relative overflow-hidden cursor-pointer group"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-white" />
                <span className="text-sm font-semibold uppercase tracking-wider text-white/80">AI Tavsiyalar</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Tajribangizga mos <br />ish topish</h2>
              <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                Assistantdan so'rash <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </FadeUp>

        <section className="space-y-4">
          <h3 className="text-lg font-bold">Kategoriyalar</h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map((cat) => (
              <motion.div
                key={cat.name}
                whileHover={{ scale: 1.05 }}
                className="flex-shrink-0 p-4 w-32 vaqta-glass text-center space-y-2 cursor-pointer"
              >
                <span className="text-2xl">{cat.icon}</span>
                <p className="text-sm font-semibold">{cat.name}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-[#00A86B]" />
            <h3 className="text-lg font-bold">Ommabop</h3>
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
  return (
    <motion.div 
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
      whileHover={{ y: -4 }}
      className="vaqta-glass p-5 space-y-4"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h4 className="font-bold text-lg leading-tight">{vacancy.title}</h4>
          <p className="text-sm text-slate-400 font-medium">{vacancy.employers?.name || "Kompaniya"}</p>
        </div>
        <div className="bg-[#00A86B]/10 text-[#00A86B] p-2 rounded-xl">
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
          <span>Vaxta 30/30</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-lg font-bold text-[#00A86B]">от {vacancy.salary_from || 0} ₽</span>
        <div className="flex gap-2">
          <button className="p-2 rounded-xl border border-[#1A3D2E] text-slate-400 hover:text-white transition-colors">
            <Heart size={18} />
          </button>
          <button 
            onClick={() => window.open(vacancy.url, '_blank')}
            className="px-4 py-2 bg-white text-black rounded-xl text-sm font-bold"
          >
            Batafsil
          </button>
        </div>
      </div>
    </motion.div>
  );
}