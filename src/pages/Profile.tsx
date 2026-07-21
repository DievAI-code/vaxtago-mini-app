"use client";

import { motion } from "framer-motion";
import { 
  Settings, 
  Clock, 
  CreditCard, 
  LogOut, 
  ChevronRight,
  Shield,
  Bell,
  Languages
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useTranslation } from "react-i18next";
import { useApp } from "@/lib/theme";
import { Lang } from "@/i18n";
import { FadeUp } from "@/components/animations";

const LANG_MAP = {
  uz: { name: "O'zbekcha", flag: "🇺🇿" },
  ru: { name: "Русский", flag: "🇷🇺" },
  tg: { name: "Тоҷикӣ", flag: "🇹🇯" },
};

export default function Profile() {
  const { t } = useTranslation();
  const { lang, setLang } = useApp();

  const cycleLanguage = () => {
    const langs: Lang[] = ["uz", "ru", "tg"];
    const nextIdx = (langs.indexOf(lang) + 1) % langs.length;
    setLang(langs[nextIdx]);
  };

  const menu = [
    { icon: <Clock size={20} />, label: "Tarix", color: "text-blue-500" },
    { icon: <CreditCard size={20} />, label: t("profile_subscription"), color: "text-purple-500" },
    { icon: <Shield size={20} />, label: "Xavfsizlik", color: "text-green-500" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32 text-white">
      <header className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("nav_profile")}</h1>
        <button className="p-2 bg-[#0C1F1A] border border-[#1A3D2E] rounded-xl text-[#5C7A6D]">
          <Bell size={20} />
        </button>
      </header>

      <main className="px-6 space-y-8">
        <FadeUp>
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-[2rem] vaqta-gradient p-1">
                <div className="w-full h-full rounded-[1.8rem] bg-[#06140F] flex items-center justify-center overflow-hidden">
                  <img src="https://avatar.vercel.sh/user" alt="avatar" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Foydalanuvchi</h2>
              <p className="text-[#5C7A6D] text-sm">VaxtaGo Premium</p>
            </div>
          </div>
        </FadeUp>

        <section className="space-y-3">
          <motion.div
            whileHover={{ x: 4 }}
            onClick={cycleLanguage}
            className="vaqta-glass p-4 flex items-center gap-4 cursor-pointer border-[#1A3D2E]"
          >
            <div className="text-[#D4AF37] bg-white/5 p-3 rounded-2xl">
              <Languages size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-[#5C7A6D] uppercase font-bold">{t("settings_lang")}</p>
              <p className="text-sm font-semibold">{LANG_MAP[lang].flag} {LANG_MAP[lang].name}</p>
            </div>
            <ChevronRight size={18} className="text-[#5C7A6D]" />
          </motion.div>

          {menu.map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ x: 4 }}
              className="vaqta-glass p-4 flex items-center gap-4 cursor-pointer border-[#1A3D2E]"
            >
              <div className={`${item.color} bg-white/5 p-3 rounded-2xl`}>
                {item.icon}
              </div>
              <span className="flex-1 font-semibold text-sm">{item.label}</span>
              <ChevronRight size={18} className="text-[#5C7A6D]" />
            </motion.div>
          ))}
        </section>

        <FadeUp>
          <button className="w-full p-4 flex items-center justify-center gap-2 text-red-500 font-bold border border-red-500/20 rounded-[1.5rem] bg-red-500/5 hover:bg-red-500/10 transition-all">
            <LogOut size={20} />
            {t("logout")}
          </button>
        </FadeUp>
      </main>

      <BottomNav />
    </div>
  );
}