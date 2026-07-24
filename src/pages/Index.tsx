"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Briefcase, FileText, Camera, MapPin, Bot, Globe, Calendar, ShieldAlert } from "lucide-react";
import VaqtaLogo from "@/components/VaqtaLogo";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";
import { useTranslation } from "react-i18next";

export default function Index() {
  const nav = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6 flex items-center justify-between sticky top-0 bg-[#06140F]/80 backdrop-blur-md z-40 border-b border-[#1A3D2E]">
        <div className="flex items-center gap-3">
          <VaqtaLogo size={36} animated />
          <h1 className="text-2xl font-black tracking-tighter">VAQTA <span className="vaqta-gold-text">AI</span></h1>
        </div>
        <div className="flex items-center gap-2 bg-[#0C1F1A] border border-[#1A3D2E] px-4 py-2 rounded-full cursor-pointer" onClick={() => nav("/login")}>
          <Globe size={14} className="text-[#00A86B]" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t("settings_lang") || "Язык"}</span>
        </div>
      </header>

      <main className="px-6 space-y-6 mt-4">
        <FadeUp>
          <div className="bg-[#0C1F1A] rounded-[2.5rem] p-6 space-y-4 border border-[#00A86B]/30 relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 text-[#00A86B] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Bot size={14} /> VAQTA AI
              </div>
              <h2 className="text-2xl font-black text-white leading-snug">
                {t("greeting")}
              </h2>
            </div>
          </div>
        </FadeUp>

        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D] ml-2">{t("home.quick_services")}</h3>
          
          <div className="space-y-2.5">
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => nav("/jobs-test")}
              className="w-full vaqta-glass p-4 border-[#1A3D2E] flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-[#00A86B] flex items-center justify-center text-white">
                <Briefcase size={22} />
              </div>
              <span className="font-extrabold text-base text-white">{t("home.find_job")}</span>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => nav("/contract-audit")}
              className="w-full vaqta-glass p-4 border-[#1A3D2E] flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white">
                <FileText size={22} />
              </div>
              <span className="font-extrabold text-base text-white">{t("home.check_doc")}</span>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => nav("/scanner")}
              className="w-full vaqta-glass p-4 border-[#1A3D2E] flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-white">
                <Camera size={22} />
              </div>
              <span className="font-extrabold text-base text-white">{t("home.translate_photo")}</span>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => nav("/maps")}
              className="w-full vaqta-glass p-4 border-[#1A3D2E] flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                <MapPin size={22} />
              </div>
              <span className="font-extrabold text-base text-white">{t("home.find_address")}</span>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => nav("/ai")}
              className="w-full vaqta-glass p-4 border-[#1A3D2E] flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00A86B] to-teal-400 flex items-center justify-center text-white">
                <Bot size={22} />
              </div>
              <span className="font-extrabold text-base text-white">{t("home.ask_ai")}</span>
            </motion.button>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}