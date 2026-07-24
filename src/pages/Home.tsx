"use client";

import { useNavigate } from "react-router-dom";
import { 
  Briefcase, FileText, Camera, MapPin, Bot, 
  ChevronRight, Calendar, ShieldAlert
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { FadeUp } from "@/components/animations";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageProvider";
import { motion } from "framer-motion";

export default function Home() {
  const nav = useNavigate();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainActions = [
    {
      title: t("home.find_job"),
      icon: Briefcase,
      path: "/jobs-test",
      color: "from-emerald-500 to-[#00A86B]",
    },
    {
      title: t("home.check_doc"),
      icon: FileText,
      path: "/contract-audit",
      color: "from-blue-600 to-cyan-500",
    },
    {
      title: t("home.translate_photo"),
      icon: Camera,
      path: "/scanner",
      color: "from-purple-600 to-indigo-500",
    },
    {
      title: t("home.find_address"),
      icon: MapPin,
      path: "/maps",
      color: "from-amber-500 to-orange-500",
    },
    {
      title: t("home.ask_ai"),
      icon: Bot,
      path: "/ai",
      color: "from-[#00A86B] to-teal-400",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-40 safe-top">
      <Header title="nav.home" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="px-6 space-y-6 mt-4">
        {/* Main Greeting Banner */}
        <FadeUp>
          <div className="p-6 rounded-[2.5rem] vaqta-glass border-[#00A86B]/30 relative overflow-hidden bg-gradient-to-br from-[#00A86B]/10 via-transparent to-transparent space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="text-[#00A86B]" size={28} />
              <span className="font-black text-white text-lg tracking-tight">VAQTA AI</span>
            </div>
            <h2 className="text-2xl font-black text-white leading-snug">
              {t("greeting")}
            </h2>
          </div>
        </FadeUp>

        {/* 5 Main Buttons requested */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D] ml-2">
            {t("home.quick_services")}
          </h3>

          <div className="space-y-2.5">
            {mainActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => nav(action.path)}
                  className="w-full vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between group hover:border-[#00A86B]/50 transition-all shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg`}>
                      <Icon size={22} />
                    </div>
                    <span className="font-extrabold text-base text-white text-left">
                      {action.title}
                    </span>
                  </div>
                  <ChevronRight size={20} className="text-[#5C7A6D] group-hover:text-[#00A86B] group-hover:translate-x-1 transition-all" />
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Extra Legal & Patent Controls */}
        <section className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => nav("/tracker")} 
              className="vaqta-glass p-5 space-y-2 cursor-pointer hover:border-[#00A86B]/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
                <Calendar size={20} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">{t("home.tracker_title")}</h4>
                <p className="text-[9px] text-[#5C7A6D] mt-0.5">{t("home.tracker_desc")}</p>
              </div>
            </div>

            <div 
              onClick={() => nav("/sos")} 
              className="vaqta-glass p-5 space-y-2 cursor-pointer hover:border-red-500/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">{t("home.sos_title")}</h4>
                <p className="text-[9px] text-[#5C7A6D] mt-0.5">{t("home.sos_desc")}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}