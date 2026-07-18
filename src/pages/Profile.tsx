import { useState } from "react";
import { motion } from "framer-motion";
import { User, CreditCard, History, Settings, LogOut, ChevronRight, Shield, Crown } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
import { VIdentity, VPremium } from "@/components/icons/VaxtaGoIcons";
import { useTranslation } from "react-i18next";
import { useTelegramUser } from "@/components/TelegramProvider";
import { FadeUp, stagger, fadeUp } from "@/components/animations";

export default function Profile() {
  const { t } = useTranslation();
  const { firstName, username, telegramId } = useTelegramUser();

  const menuItems = [
    { icon: <Settings className="w-5 h-5" />, label: "Настройки", path: "/settings" },
    { icon: <History className="w-5 h-5" />, label: "История операций", path: "/history" },
    { icon: <Shield className="w-5 h-5" />, label: "Безопасность", path: "/security" },
    { icon: <Crown className="w-5 h-5" />, label: "Premium", path: "/premium" },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0F172A] text-white">
      <Header title="Профиль" />
      
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <FadeUp>
          <Card variant="gradient" className="mb-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center mb-3">
              <VIdentity className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold">{firstName || "Пользователь"}</h2>
            <p className="text-sm text-slate-400">@{username || "vaxtago_user"}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="px-3 py-1 rounded-full bg-slate-800/50 text-xs text-[#06B6D4]">ID: {telegramId || "123456"}</span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-xs text-amber-400">FREE</span>
            </div>
          </Card>
        </FadeUp>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-2 mb-6">
          {menuItems.map((item, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card variant="default" className="flex items-center gap-3 py-3 cursor-pointer hover:bg-slate-700/30" onClick={() => {}}>
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-[#06B6D4]">
                  {item.icon}
                </div>
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight size={18} className="text-slate-400" />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <FadeUp>
          <Card variant="gradient" className="flex items-center gap-3 mb-4">
            <VPremium className="w-8 h-8 text-[#14B8A6]" />
            <div className="flex-1">
              <p className="font-bold">VaxtaGo Premium</p>
              <p className="text-xs text-slate-400">Безлимитный AI и приоритет</p>
            </div>
            <Button size="sm" variant="primary">Подключить</Button>
          </Card>
        </FadeUp>

        <FadeUp>
          <Button variant="ghost" className="w-full text-red-400" icon={<LogOut size={18} />}>
            Выйти
          </Button>
        </FadeUp>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">© 2026 VaxtaGo • Made by Dmitry Diev</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}