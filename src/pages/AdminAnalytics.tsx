import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Activity, Eye, Bot, TrendingUp, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
import { analytics } from "@/services/Analytics";
import { FadeUp, stagger, fadeUp } from "@/components/animations";
import { useNavigate } from "react-router-dom";

export default function AdminAnalytics() {
  const nav = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    appOpens: 0,
    aiRequests: 0,
    popularFunctions: [] as { name: string; count: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const data = await analytics.getStats();
    setStats(data);
    setLoading(false);
  }

  const cards = [
    { icon: <Users className="w-6 h-6" />, label: "Пользователи", value: stats.totalUsers, color: "text-[#2563EB]" },
    { icon: <Activity className="w-6 h-6" />, label: "Активные сегодня", value: stats.activeToday, color: "text-[#22C55E]" },
    { icon: <Eye className="w-6 h-6" />, label: "Открытия приложения", value: stats.appOpens, color: "text-[#7C3AED]" },
    { icon: <Bot className="w-6 h-6" />, label: "AI запросы", value: stats.aiRequests, color: "text-[#06B6D4]" },
  ];

  const funcLabels: Record<string, string> = {
    vacancy_open: "Открытие вакансий",
    vacancy_apply: "Отклик на вакансию",
    photo_translate_start: "Фото перевод",
    ai_assistant_used: "AI помощник",
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#080B14] text-white">
      <Header title="Аналитика" />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <FadeUp>
          <div className="flex items-center gap-3 mb-6">
            <VaxtaGoLogo size={40} />
            <div>
              <h1 className="text-xl font-bold vg-gradient-text">VaxtaGo Analytics</h1>
              <p className="text-xs text-slate-400">Панель администратора</p>
            </div>
          </div>
        </FadeUp>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED]/40 border-t-[#7C3AED] animate-spin" />
          </div>
        ) : (
          <>
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 gap-3 mb-6">
              {cards.map((c, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card variant="gradient" className="text-center">
                    <div className={`w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-2 ${c.color}`}>
                      {c.icon}
                    </div>
                    <p className="text-2xl font-bold">{c.value}</p>
                    <p className="text-xs text-slate-300">{c.label}</p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <FadeUp>
              <h3 className="text-lg font-bold mb-3 px-1 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#7C3AED]" />
                Популярные функции
              </h3>
              {stats.popularFunctions.length === 0 ? (
                <Card variant="default" className="text-center py-8">
                  <p className="text-slate-400 text-sm">Нет данных</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {stats.popularFunctions.map((f, i) => (
                    <Card key={i} variant="default" className="flex items-center justify-between py-3">
                      <span className="font-medium text-sm">{funcLabels[f.name] || f.name}</span>
                      <span className="text-sm text-[#7C3AED] font-bold">{f.count}</span>
                    </Card>
                  ))}
                </div>
              )}
            </FadeUp>

            <FadeUp>
              <div className="mt-6">
                <Button variant="secondary" size="lg" className="w-full" icon={<ArrowLeft size={18} />} onClick={() => nav("/")}>
                  На главную
                </Button>
              </div>
            </FadeUp>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}