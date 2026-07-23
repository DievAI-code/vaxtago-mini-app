"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Search, Rocket, Clock, Briefcase, MapPin, Calendar, 
  CheckCircle2, Loader2, Construction, Truck, Factory, 
  Package, Wrench, Hammer, Send, Sparkles 
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideMenu } from "@/components/SideMenu";
import { useLanguage } from "@/context/LanguageProvider";
import { jobsApiStatus, JobsApiStatus } from "@/services/jobsApiStatus";
import { subscription } from "@/services/subscription";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const CATEGORIES = [
  { icon: Construction, label: "Строительство", color: "text-amber-400" },
  { icon: Truck, label: "Водители", color: "text-blue-400" },
  { icon: Factory, label: "Производство", color: "text-purple-400" },
  { icon: Package, label: "Склад", color: "text-orange-400" },
  { icon: Wrench, label: "Сварщики", color: "text-cyan-400" },
  { icon: Hammer, label: "Разнорабочие", color: "text-emerald-400" },
];

export default function Jobs() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const [query] = useState(params.get("query") || "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState<JobsApiStatus>({ hh: "pending", trudvsem: "pending" });
  
  // Form state
  const [profession, setProfession] = useState(query);
  const [city, setCity] = useState("");
  const [schedule, setSchedule] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const s = await jobsApiStatus.check();
    setStatus(s);
  };

  const handleSubmitInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profession.trim()) {
      toast.error("Укажите профессию");
      return;
    }

    const access = await subscription.checkUserAccess("jobs");
    if (!access.allowed) {
      toast.error("Дневной лимит поиска вакансий исчерпан.");
      return;
    }

    setSubmitting(true);
    try {
      const phone = localStorage.getItem("vaxtago_user_phone");
      if (!phone) {
        toast.error("Требуется авторизация");
        return;
      }

      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("phone_number", phone)
        .maybeSingle();

      if (!user) {
        toast.error("Пользователь не найден");
        return;
      }

      const { error } = await supabase.from("job_interest").insert({
        user_id: user.id,
        profession: profession.trim(),
        city: city.trim() || null,
        schedule: schedule.trim() || null
      });

      if (error) throw error;
      
      await subscription.trackUsage("jobs");
      setSubmitted(true);
      toast.success("Заявка сохранена! Мы сообщим о запуске.");
    } catch (err) {
      toast.error("Ошибка сохранения");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategoryClick = () => {
    toast.info("Поиск по категориям станет доступен после подключения источников вакансий");
  };

  const isConnected = jobsApiStatus.isAnyConnected(status);

  if (isConnected) {
    return (
      <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
        <Header title="nav.jobs" onMenuClick={() => setMenuOpen(true)} />
        <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="p-6">
          <div className="vaqta-glass p-8 border-[#00A86B]/30 text-center space-y-4">
            <CheckCircle2 className="mx-auto text-[#00A86B]" size={48} />
            <h2 className="text-xl font-black">API подключены!</h2>
            <p className="text-xs text-[#5C7A6D]">Реальный поиск вакансий активирован.</p>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="nav.jobs" onMenuClick={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="p-6 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 py-8"
        >
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-[2.5rem] vaqta-gradient flex items-center justify-center mx-auto shadow-2xl vaqta-glow">
              <Rocket size={40} className="text-white" />
            </div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-[2.5rem] bg-[#00A86B]/30 blur-xl"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">
              AI-поиск работы <span className="text-[#00A86B]">скоро будет доступен</span>
            </h1>
            <p className="text-xs text-[#5C7A6D] font-medium leading-relaxed max-w-xs mx-auto">
              Мы подключаем официальные источники вакансий, чтобы вы получали реальные предложения от проверенных работодателей.
            </p>
          </div>
        </motion.div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-1">Статус подключения</h3>
          
          <div className="vaqta-glass p-5 border-[#1A3D2E] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">HeadHunter</p>
                <p className="text-[10px] text-amber-400 font-bold uppercase">Подключение выполняется</p>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>

          <div className="vaqta-glass p-5 border-[#1A3D2E] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Работа России</p>
                <p className="text-[10px] text-amber-400 font-bold uppercase">Подготовка источника</p>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmitInterest}
              className="vaqta-glass p-6 border-[#00A86B]/20 space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-[#00A86B]" />
                <h3 className="text-sm font-black uppercase tracking-widest text-[#00A86B]">Какую работу вы ищете?</h3>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C7A6D]" size={16} />
                  <input
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="Профессия (например: сварщик)"
                    className="w-full h-14 bg-[#06140F] border border-[#1A3D2E] rounded-2xl pl-12 pr-4 text-sm font-bold text-white focus:border-[#00A86B] outline-none transition-all"
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C7A6D]" size={16} />
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Город"
                    className="w-full h-14 bg-[#06140F] border border-[#1A3D2E] rounded-2xl pl-12 pr-4 text-sm font-bold text-white focus:border-[#00A86B] outline-none transition-all"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C7A6D]" size={16} />
                  <input
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="Желаемый график (вахта, смены...)"
                    className="w-full h-14 bg-[#06140F] border border-[#1A3D2E] rounded-2xl pl-12 pr-4 text-sm font-bold text-white focus:border-[#00A86B] outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-16 vaqta-gradient rounded-2xl font-black text-white uppercase text-xs tracking-widest shadow-xl vaqta-glow flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Сообщить о запуске</>}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="vaqta-glass p-8 border-[#00A86B]/30 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-[#00A86B]/10 flex items-center justify-center mx-auto text-[#00A86B]">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-black">Заявка принята!</h3>
              <p className="text-xs text-[#5C7A6D]">Мы сообщим вам, как только поиск станет доступен.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-1">Популярные категории</h3>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat, idx) => (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.95 }}
                onClick={handleCategoryClick}
                className="vaqta-glass p-5 border-[#1A3D2E] flex flex-col items-center gap-3 text-center active:scale-95 transition-transform"
              >
                <cat.icon size={24} className={cat.color} />
                <span className="text-xs font-bold text-white">{cat.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}