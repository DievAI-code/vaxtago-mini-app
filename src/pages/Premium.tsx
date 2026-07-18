import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap, Shield } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VPremium } from "@/components/icons/VaxtaGoIcons";
import { useTranslation } from "react-i18next";
import { FadeUp, stagger, fadeUp } from "@/components/animations";

const FEATURES = [
  { icon: <Zap className="w-5 h-5" />, title: "Безлимитный AI", desc: "Неограниченные запросы к помощнику" },
  { icon: <Shield className="w-5 h-5" />, title: "Проверка работодателей", desc: "Полная проверка по ИНН и ОГРН" },
  { icon: <Sparkles className="w-5 h-5" />, title: "Приоритетная поддержка", desc: "Ответ в течение 5 минут" },
  { icon: <Crown className="w-5 h-5" />, title: "Хранение документов", desc: "Безлимитное облачное хранилище" },
];

export default function Premium() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0F172A] text-white">
      <Header title="Premium" />
      
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <FadeUp>
          <Card variant="gradient" className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center mb-3">
              <VPremium className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#2563EB] to-[#14B8A6] bg-clip-text text-transparent">VaxtaGo Premium</h2>
            <p className="text-slate-400 text-sm mt-1">Откройте все возможности платформы</p>
            <div className="mt-4">
              <span className="text-3xl font-bold">299 ₽</span>
              <span className="text-slate-400">/месяц</span>
            </div>
          </Card>
        </FadeUp>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-3 mb-6">
          {FEATURES.map((f, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card variant="default" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB]/20 to-[#14B8A6]/20 flex items-center justify-center text-[#06B6D4]">
                  {f.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-xs text-slate-400">{f.desc}</p>
                </div>
                <Check className="w-5 h-5 text-green-400" />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <FadeUp>
          <Button variant="primary" size="lg" className="w-full" icon={<Crown size={20} />}>
            Подключить Premium
          </Button>
          <p className="text-center text-xs text-slate-500 mt-3">
            Отмена в любой момент. Без скрытых платежей.
          </p>
        </FadeUp>
      </div>

      <BottomNav />
    </div>
  );
}