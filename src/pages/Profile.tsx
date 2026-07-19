import { motion } from "framer-motion";
import { User, Crown, Settings, Shield, History, ChevronRight, Phone, IdCard, Calendar } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VIdentity, VPremium } from "@/components/icons/VaxtaGoIcons";
import { useTranslation } from "react-i18next";
import { useTelegramUser } from "@/components/TelegramProvider";
import { FadeUp, stagger, fadeUp } from "@/components/animations";

export default function Profile() {
  const { t } = useTranslation();
  const { firstName, username, telegramId, photoUrl, profile, phone, isInTelegram } = useTelegramUser();

  const registeredDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("ru-RU")
    : "—";

  const menuItems = [
    { icon: <Settings className="w-5 h-5" />, label: "Настройки", path: "/settings" },
    { icon: <History className="w-5 h-5" />, label: "История операций", path: "/history" },
    { icon: <Shield className="w-5 h-5" />, label: "Безопасность", path: "/security" },
    { icon: <Crown className="w-5 h-5" />, label: "Premium", path: "/premium" },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-[#080B14] text-white">
      <Header title="Профиль" />
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <FadeUp>
          <Card variant="gradient" className="mb-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl vg-gradient flex items-center justify-center mb-3 overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <VIdentity className="w-10 h-10 text-white" />
              )}
            </div>
            <h2 className="text-xl font-bold">{firstName || "Пользователь"}</h2>
            <p className="text-sm text-white/70">@{username || "vaxtago_user"}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-[#7C3AED]">ID: {telegramId || "—"}</span>
              <span className="px-3 py-1 rounded-full bg-[#F59E0B]/20 text-xs text-[#F59E0B]">FREE</span>
            </div>
            {profile?.created_at && (
              <p className="text-xs text-white/50 mt-2 flex items-center justify-center gap-1">
                <Calendar size={12} /> Регистрация: {registeredDate}
              </p>
            )}
          </Card>
        </FadeUp>

        <FadeUp>
          <div className="space-y-2 mb-6">
            <Card variant="default" className="flex items-center gap-3 py-3"><Phone className="w-5 h-5 text-[#7C3AED]" /><span className="flex-1 text-sm">Телефон</span><span className="text-sm text-slate-400">{phone || "+998 __ ___ __ __"}</span></Card>
            <Card variant="default" className="flex items-center gap-3 py-3"><IdCard className="w-5 h-5 text-[#7C3AED]" /><span className="flex-1 text-sm">Статус подписки</span><span className="text-sm text-[#F59E0B]">FREE</span></Card>
          </div>
        </FadeUp>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-2 mb-6">
          {menuItems.map((item, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card variant="default" className="flex items-center gap-3 py-3 cursor-pointer hover:bg-white/10" onClick={() => {}}>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#7C3AED]">{item.icon}</div>
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight size={18} className="text-slate-400" />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <FadeUp>
          <Card variant="gradient" className="flex items-center gap-3 mb-4">
            <VPremium className="w-8 h-8 text-[#22C55E]" />
            <div className="flex-1"><p className="font-bold">VaxtaGo Premium</p><p className="text-xs text-white/70">Безлимитный AI и приоритет</p></div>
            <Button size="sm" variant="primary">Подключить</Button>
          </Card>
        </FadeUp>

        <div className="mt-6 text-center"><p className="text-xs text-slate-500">© 2026 VaxtaGo • Made by Dmitry Diev</p></div>
      </div>
      <BottomNav />
    </div>
  );
}