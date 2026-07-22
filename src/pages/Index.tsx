"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Camera, Sparkles, ShieldCheck, MessageSquare, Globe, ArrowRight, TrendingUp } from "lucide-react";
import VaqtaLogo from "@/components/VaqtaLogo";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";
import { useTranslation } from "react-i18next";

export default function Index() {
  const nav = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6 flex items-center justify-between sticky top-0 bg-[#06140F]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <VaqtaLogo size={36} animated />
          <h1 className="text-2xl font-black tracking-tighter">VAQTA <span className="vaqta-gold-text">AI</span></h1>
        </div>
        <div className="flex items-center gap-2 bg-[#0C1F1A] border border-[#1A3D2E] px-4 py-2 rounded-full cursor-pointer" onClick={() => nav("/login")}>
          <Globe size={14} className="text-[#00A86B]" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t("settings_lang")}</span>
        </div>
      </header>

      <main className="px-6 space-y-8 mt-4">
        <FadeUp>
          <div className="relative group overflow-hidden rounded-[3rem] p-1 bg-gradient-to-br from-[#00A86B]/40 to-transparent">
            <div className="bg-[#06140F] rounded-[2.9rem] p-8 space-y-6 relative overflow-hidden border border-white/5">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 text-[#00A86B] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#00A86B]/20">
                  <Sparkles size={12} /> {t("home.hero_subtitle")}
                </div>
                <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-white whitespace-pre-wrap">
                  {t("home.hero_title")}
                </h2>
                
                <div className="flex flex-col gap-3 pt-4">
                  <motion.button 
                    whileTap={{ scale: 0.97 }}
                    onClick={() => nav("/scanner")}
                    className="w-full h-16 rounded-2xl vaqta-gradient flex items-center justify-center gap-3 text-lg font-black text-white shadow-xl vaqta-glow"
                  >
                    <Camera size={24} /> {t("home.btn_upload")}
                  </motion.button>
                  
                  <motion.button 
                    whileTap={{ scale: 0.97 }}
                    onClick={() => nav("/ai")}
                    className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-lg font-bold text-white"
                  >
                    <MessageSquare size={20} className="text-[#00A86B]" /> {t("home.btn_chat")}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D]">{t("home.quick_services")}</h3>
            <span className="text-[10px] font-black text-[#00A86B]">{t("home.all_services")} →</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => nav("/jobs")} className="vaqta-glass p-6 space-y-4 cursor-pointer hover:border-[#00A86B]/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#00A86B]/10 flex items-center justify-center">
                <ShieldCheck className="text-[#00A86B]" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">AI Job Check</h4>
                <p className="text-[10px] text-[#5C7A6D] mt-1">{t("home.search_job")}</p>
              </div>
            </div>

            <div onClick={() => nav("/scanner")} className="vaqta-glass p-6 space-y-4 cursor-pointer hover:border-[#D4AF37]/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
                <ArrowRight className="text-[#D4AF37]" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">AI Translator</h4>
                <p className="text-[10px] text-[#5C7A6D] mt-1">{t("home.scanner_desc")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="vaqta-glass p-8 border-dashed border-[#1A3D2E] relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#5C7A6D] uppercase tracking-widest">{t("home.market_analysis")}</p>
                <p className="text-sm font-bold text-white">Rossiya & BAA</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-[#5C7A6D] leading-relaxed font-medium">
            {t("home.market_desc")}
          </p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}