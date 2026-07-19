import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mic, Camera, Keyboard, Briefcase, FileText, Globe, Shield, MapPin, Wallet, Star } from "lucide-react";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VCareer, VDocument, VGlobal, VShield, VVision } from "@/components/icons/VaxtaGoIcons";
import { useTelegramUser } from "@/components/TelegramProvider";
import { useApp } from "@/lib/theme";
import { FadeUp, stagger, fadeUp } from "@/components/animations";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface Vacancy {
  id: string;
  title: string;
  company: string;
  city: string;
  salary: string;
  rating: number;
  verified: boolean;
}

export default function Index() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { firstName } = useTelegramUser();
  const { lang } = useApp();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);

  useEffect(() => {
    loadVacancies();
  }, []);

  async function loadVacancies() {
    try {
      const { data } = await supabase.from("vacancies").select("*, employers(name, rating, verified)").limit(3);
      setVacancies((data || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        company: v.employers?.name || "Компания",
        city: v.city,
        salary: `${v.salary_from}–${v.salary_to} ₽`,
        rating: v.employers?.rating || 4.5,
        verified: v.employers?.verified || false,
      })));
    } catch {}
  }

  const QUICK = [
    { icon: <VCareer className="w-6 h-6" />, label: "Найти работу", path: "/jobs" },
    { icon: <VDocument className="w-6 h-6" />, label: "Проверить документ", path: "/documents" },
    { icon: <VGlobal className="w-6 h-6" />, label: "Перевести текст", path: "/translate" },
    { icon: <VVision className="w-6 h-6" />, label: "Фото переводчик", path: "/photo-translator" },
    { icon: <VShield className="w-6 h-6" />, label: "Проверить работодателя", path: "/employer" },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-[#080B14] text-white">
      <div className="flex-shrink-0 p-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl vg-gradient flex items-center justify-center">
              <span className="text-white font-bold text-lg">{firstName?.[0]?.toUpperCase() || "V"}</span>
            </div>
            <div>
              <p className="text-sm text-slate-400">Добро пожаловать в</p>
              <h1 className="text-xl font-bold vg-gradient-text">VaxtaGo</h1>
            </div>
          </div>
          <VaxtaGoLogo size={36} />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        <FadeUp>
          <Card variant="gradient" className="mb-6" onClick={() => nav("/ai")}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">🤖</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Vaxta AI</h3>
                <p className="text-white/70 text-sm">Чем могу помочь?</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="secondary" icon={<Mic size={16} />} onClick={(e) => { e.stopPropagation(); }}>Голос</Button>
              <Button size="sm" variant="secondary" icon={<Camera size={16} />} onClick={(e) => { e.stopPropagation(); nav("/scanner"); }}>Фото</Button>
              <Button size="sm" variant="primary" icon={<Keyboard size={16} />} onClick={(e) => { e.stopPropagation(); nav("/ai"); }}>Написать</Button>
            </div>
          </Card>
        </FadeUp>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 gap-3 mb-6">
          {QUICK.map((action, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card onClick={() => nav(action.path)} className="h-full">
                <div className="w-12 h-12 rounded-2xl vg-gradient flex items-center justify-center text-white mb-3">{action.icon}</div>
                <span className="font-semibold text-sm">{action.label}</span>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <FadeUp>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-lg font-bold">Вакансии</h3>
            <button onClick={() => nav("/jobs")} className="text-sm text-[#7C3AED]">Все →</button>
          </div>
          <div className="space-y-3">
            {vacancies.length === 0 ? (
              <Card variant="default" className="text-center py-8">
                <p className="text-slate-400 text-sm">Загрузка вакансий...</p>
              </Card>
            ) : vacancies.map((v) => (
              <Card key={v.id} variant="default" className="hover:bg-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate">{v.title}</h4>
                    <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                      {v.company}
                      {v.verified && <span className="text-[#22C55E]">✓</span>}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {v.city}</span>
                      <span className="flex items-center gap-1 text-[#22C55E]"><Wallet size={12} /> {v.salary}</span>
                      <span className="flex items-center gap-1 text-amber-400"><Star size={12} /> {v.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="primary" onClick={() => nav("/jobs")}>Откликнуться</Button>
                  <Button size="sm" variant="secondary">Сохранить</Button>
                </div>
              </Card>
            ))}
          </div>
        </FadeUp>
      </div>
    </div>
  );
}