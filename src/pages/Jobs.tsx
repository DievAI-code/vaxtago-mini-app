import { useState, useEffect } from "react";
import { MapPin, Wallet, Briefcase, Building2, Filter, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
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
}

export default function Jobs() {
  const { t } = useTranslation();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadVacancies();
  }, []);

  async function loadVacancies() {
    try {
      const { data, error } = await supabase.from("vacancies").select("*, employers(name)").limit(10);
      if (error) throw error;
      setVacancies((data || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        company: v.employers?.name || "Компания",
        city: v.city,
        salary: `${v.salary_from}–${v.salary_to} ₽`,
        description: v.description,
        url: v.url,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = vacancies.filter(v => 
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0F172A] text-white">
      <Header title="Работа" />
      
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-2xl px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск вакансий..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-400"
          />
          <Filter size={18} className="text-slate-400" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[#06B6D4]/40 border-t-[#06B6D4] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <FadeUp>
            <Card variant="default" className="text-center py-12">
              <VCareer className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Вакансий не найдено</p>
              <p className="text-xs text-slate-500 mt-1">Попробуйте изменить запрос</p>
            </Card>
          </FadeUp>
        ) : (
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-3">
            {filtered.map((v, i) => (
              <motion.div key={v.id} variants={fadeUp}>
                <Card variant="default" className="hover:bg-slate-700/30">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 to-[#14B8A6]/20 flex items-center justify-center text-[#06B6D4] flex-shrink-0">
                      <VCareer className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{v.title}</h3>
                      <p className="text-[#06B6D4] text-sm flex items-center gap-1">
                        <Building2 size={14} /> {v.company}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><MapPin size={14} /> {v.city}</span>
                        <span className="flex items-center gap-1 text-green-400"><Wallet size={14} /> {v.salary}</span>
                      </div>
                      <p className="text-sm text-slate-300 mt-2 line-clamp-2">{v.description}</p>
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