import { useState, useEffect } from "react";
import { MapPin, Wallet, Briefcase, Building2, Filter, Search, Star, CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VCareer } from "@/components/icons/VaxtaGoIcons";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { FadeUp, stagger, fadeUp } from "@/components/animations";

interface Vacancy {
  id: string;
  title: string;
  company: string;
  city: string;
  salary: string;
  description: string;
  url: string;
  rating: number;
  verified: boolean;
}

export default function Jobs() {
  const { t } = useTranslation();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("Все");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { loadVacancies(); }, []);

  async function loadVacancies() {
    try {
      const { data, error } = await supabase.from("vacancies").select("*, employers(name, rating, verified)").limit(20);
      if (error) throw error;
      setVacancies((data || []).map((v: any) => ({
        id: v.id, title: v.title, company: v.employers?.name || "Компания",
        city: v.city, salary: `${v.salary_from}–${v.salary_to} ₽`, description: v.description, url: v.url,
        rating: v.employers?.rating || 4.5, verified: v.employers?.verified || false,
      })));
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }

  const filtered = vacancies.filter(v =>
    (city === "Все" || v.city === city) &&
    (v.title.toLowerCase().includes(search.toLowerCase()) || v.company.toLowerCase().includes(search.toLowerCase()))
  );

  const cities = ["Все", ...Array.from(new Set(vacancies.map(v => v.city)))];

  return (
    <div className="flex flex-col h-[100dvh] bg-[#080B14] text-white">
      <Header title="Работа" />
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 space-y-2">
        <div className="flex items-center gap-2 glass-card rounded-2xl px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск вакансий..." className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-400" />
          <button onClick={() => setShowFilters(!showFilters)} className="text-[#7C3AED]"><Filter size={18} /></button>
        </div>
        {showFilters && (
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-2">Город</p>
              <div className="flex flex-wrap gap-2">
                {cities.map(c => (
                  <button key={c} onClick={() => setCity(c)} className={`px-3 py-1.5 rounded-full text-xs ${city === c ? "vg-gradient text-white" : "glass-card"}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-2">Специальность</p>
              <div className="flex flex-wrap gap-2">
                {["Сварщик", "Водитель", "Строитель", "Электрик"].map(s => (
                  <button key={s} className="px-3 py-1.5 rounded-full text-xs glass-card">{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="w-8 h-8 rounded-full border-2 border-[#7C3AED]/40 border-t-[#7C3AED] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <FadeUp><Card variant="default" className="text-center py-12"><VCareer className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-slate-400">Вакансий не найдено</p></Card></FadeUp>
        ) : (
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-3">
            {filtered.map((v, i) => (
              <motion.div key={v.id} variants={fadeUp}>
                <Card variant="default" className="hover:bg-white/10">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl vg-gradient flex items-center justify-center text-white flex-shrink-0"><VCareer className="w-6 h-6" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{v.title}</h3>
                      <p className="text-[#7C3AED] text-sm flex items-center gap-1"><Building2 size={14} /> {v.company} {v.verified && <CheckCircle size={14} className="text-[#22C55E]" />}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><MapPin size={14} /> {v.city}</span>
                        <span className="flex items-center gap-1 text-[#22C55E]"><Wallet size={14} /> {v.salary}</span>
                        <span className="flex items-center gap-1 text-amber-400"><Star size={14} /> {v.rating}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="primary" onClick={() => window.open(v.url, "_blank")}>Откликнуться</Button>
                        <Button size="sm" variant="secondary">Сохранить</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}