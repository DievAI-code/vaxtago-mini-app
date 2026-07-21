"use client";

import { useState } from "react";
import { Search, ShieldCheck, MapPin, DollarSign, Sparkles, Filter, Briefcase } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Vacancy } from "@/types/database";
import { useLanguage } from "@/context/LanguageProvider";
import { GoogleMapsButton } from "@/components/GoogleMapsButton";

export default function Jobs() {
  const { t } = useLanguage();
  const [query, setInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Vacancy[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    
    try {
      const { data } = await supabase
        .from("vacancies")
        .select("*, employers(*)")
        .ilike('title', `%${query}%`)
        .limit(10);
      
      setResults(data as Vacancy[] || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6">
        <h1 className="text-2xl font-bold tracking-tight">Smart AI Search</h1>
        <p className="text-[#5C7A6D] text-xs font-black uppercase tracking-widest mt-1">Siz yozing, AI filtrlarni topadi</p>
      </header>

      <main className="px-6 space-y-8">
        <FadeUp>
          <div className="relative vaqta-glass border-[#00A86B]/20 p-2 focus-within:border-[#00A86B]/40 transition-all shadow-xl">
            <div className="flex items-center gap-3 px-4">
              <Sparkles size={20} className="text-[#00A86B]" />
              <input 
                type="text"
                value={query}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Menga Moskvada haydovchi ish kerak..."
                className="flex-1 bg-transparent py-4 text-sm outline-none placeholder-[#5C7A6D] font-medium"
              />
              <button onClick={handleSearch} disabled={isSearching} className="bg-[#00A86B] p-3 rounded-2xl shadow-lg hover:scale-105 transition-transform">
                <Search size={20} />
              </button>
            </div>
            {isSearching && <div className="absolute bottom-0 left-0 h-0.5 bg-[#00A86B] ai-shimmer w-full" />}
          </div>
        </FadeUp>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D]">Найдено: {results.length}</h3>
            <Filter size={16} className="text-[#5C7A6D]" />
          </div>
          
          <div className="space-y-4">
            {results.length > 0 ? results.map((v, i) => (
              <motion.div 
                key={v.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="vaqta-glass p-6 border-[#1A3D2E] transition-all relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg leading-tight">{v.title}</h4>
                    <p className="text-xs font-bold text-[#5C7A6D]">{v.employers?.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#00A86B]/10 text-[#00A86B] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-[#00A86B]/20">
                    <ShieldCheck size={12} /> Safe
                  </div>
                </div>
                
                <div className="flex gap-4 text-xs text-[#5C7A6D] mb-4 relative z-10">
                  <div className="flex items-center gap-1.5 font-bold"><MapPin size={14}/> {v.city}</div>
                  <div className="flex items-center gap-1.5 text-[#00A86B] font-black"><DollarSign size={14}/> {v.salary_from} ₽</div>
                </div>

                <div className="mb-4">
                  <p className="text-[10px] font-black text-[#5C7A6D] uppercase tracking-widest">{t("maps.job_location")}</p>
                  <p className="text-xs font-bold text-white mt-1">{v.city}, Россия</p>
                  <GoogleMapsButton address={`${v.city}, Россия`} />
                </div>

                <button onClick={() => window.open(v.url, '_blank')} className="w-full h-12 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#00A86B] hover:text-white transition-colors">Batafsil</button>
              </motion.div>
            )) : (
              <div className="text-center py-12 opacity-30">
                <Briefcase size={48} className="mx-auto mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Qidiruv natijalari yo'q</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}