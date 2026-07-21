"use client";

import { motion } from "framer-motion";
import { 
  User, Sparkles, FileText, Settings, Crown, Info, 
  ChevronRight, LogOut, Clock, Globe, Shield, Zap,
  Languages, Database, Mail, ShieldCheck, Moon
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { useLanguage } from "@/context/LanguageProvider";
import { useApp } from "@/lib/theme";
import { useState } from "react";
import { FadeUp } from "@/components/animations";

export default function Profile() {
  const { t, language } = useLanguage();
  const { theme, toggleTheme } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const SECTIONS = [
    {
      id: "user",
      title: "profile.user_section",
      items: [
        { icon: User, label: "profile.user_name", value: "Foydalanuvchi", color: "text-blue-400" },
        { icon: Globe, label: "profile.user_lang", value: language.toUpperCase(), color: "text-[#00A86B]" },
        { icon: Shield, label: "profile.user_status", value: t("profile.premium_status"), color: "text-[#D4AF37]" },
      ]
    },
    {
      id: "ai",
      title: "profile.ai_section",
      items: [
        { icon: Clock, label: "profile.ai_history", color: "text-purple-400" },
        { icon: Zap, label: "profile.ai_analysis", color: "text-orange-400" },
      ],
      action: "common.clear"
    },
    {
      id: "docs",
      title: "profile.docs_section",
      items: [
        { icon: Database, label: "profile.docs_last", color: "text-cyan-400" },
        { icon: Languages, label: "profile.docs_trans", color: "text-indigo-400" },
      ]
    },
    {
      id: "settings",
      title: "profile.settings_section",
      items: [
        { icon: Settings, label: "profile.settings_ui_lang", value: language === 'uz' ? "O'zbekcha" : language === 'ru' ? "Русский" : "Тоҷикӣ" },
        { icon: Moon, label: "profile.settings_theme", value: theme === 'dark' ? 'Dark' : 'Light', onClick: toggleTheme },
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-40">
      <Header title="nav.profile" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="px-6 mt-6 space-y-10">
        {/* User Hero */}
        <FadeUp>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-[2.5rem] vaqta-gradient p-1 shadow-2xl">
                <div className="w-full h-full rounded-[2.4rem] bg-[#06140F] flex items-center justify-center overflow-hidden">
                  <img src="https://avatar.vercel.sh/vaqta" alt="avatar" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#D4AF37] rounded-full border-4 border-[#06140F] flex items-center justify-center text-white">
                <Crown size={14} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">VAQTA User</h2>
              <p className="text-[#5C7A6D] text-[10px] font-black uppercase tracking-widest mt-1">{t("profile.premium_status")}</p>
            </div>
          </div>
        </FadeUp>

        {/* Dynamic Sections */}
        {SECTIONS.map((section) => (
          <section key={section.id} className="space-y-4">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D]">{t(section.title)}</h3>
               {section.action && <button className="text-[10px] font-black text-red-500 uppercase">{t(section.action)}</button>}
            </div>
            <div className="space-y-2">
              {section.items.map((item, idx) => (
                <motion.div 
                  key={idx}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.onClick}
                  className="vaqta-glass p-5 flex items-center gap-4 border-[#1A3D2E] group cursor-pointer"
                >
                  <div className={`p-3 rounded-2xl bg-white/5 ${item.color || "text-[#5C7A6D]"} group-hover:scale-110 transition-transform`}>
                    <item.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">{t(item.label)}</p>
                    {item.value && <p className="text-[10px] text-[#5C7A6D] font-black uppercase mt-0.5">{item.value}</p>}
                  </div>
                  <ChevronRight size={18} className="text-[#1A3D2E] group-hover:text-[#00A86B] transition-colors" />
                </motion.div>
              ))}
            </div>
          </section>
        ))}

        {/* Info Block */}
        <FadeUp>
           <div className="vaqta-glass p-8 border-dashed border-[#1A3D2E] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info size={18} className="text-[#00A86B]" />
                  <span className="text-xs font-bold">{t("profile.info_version")}</span>
                </div>
                <span className="text-[10px] font-black text-[#5C7A6D]">v3.0.4-PROD</span>
              </div>
              <button className="w-full flex items-center justify-between py-2 border-t border-[#1A3D2E] text-xs font-medium text-[#5C7A6D]">
                 {t("profile.info_policy")} <ChevronRight size={14}/>
              </button>
              <button className="w-full flex items-center justify-between py-2 border-t border-[#1A3D2E] text-xs font-medium text-[#5C7A6D]">
                 {t("profile.info_contacts")} <ChevronRight size={14}/>
              </button>
           </div>
        </FadeUp>

        {/* Logout */}
        <FadeUp>
          <button className="w-full h-16 rounded-[2rem] border border-red-500/20 bg-red-500/5 text-red-500 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-red-500/10 transition-all">
            <LogOut size={18} />
            {t("profile.logout")}
          </button>
        </FadeUp>
      </main>

      <BottomNav />
    </div>
  );
}