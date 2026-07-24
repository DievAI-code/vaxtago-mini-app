"use client";

import { motion } from "framer-motion";
import { Bot, MapPin, Camera, Sparkles, ChevronRight, Briefcase } from "lucide-react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { useLanguage } from "@/context/LanguageProvider";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Home() {
  const nav = useNavigate();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen-dynamic bg-[#06140F] text-white overflow-hidden pb-safe">
      <Header title="VAQTA AI" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="flex-1 overflow-y-auto px-5 pt-4 pb-32 no-scrollbar">
        {/* Large AI Hero Block */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-8"
        >
          <GlassCard className="p-8 border-[#00A86B]/30 bg-gradient-to-br from-[#00A86B]/10 to-transparent overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 rounded-3xl vaqta-gradient flex items-center justify-center text-white shadow-2xl vaqta-glow">
                <Bot size={36} />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-black leading-none">VAQTA <span className="text-[#00A86B]">AI</span></h1>
                <p className="text-base text-slate-400 font-medium leading-tight">
                  {t("greeting") || "Ваш умный помощник для жизни и работы."}
                </p>
              </div>

              <button 
                onClick={() => nav("/ai")}
                className="flex items-center gap-2 bg-white text-black px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#00A86B] hover:text-white transition-all shadow-xl"
              >
                <span>{t("home.ask_ai") || "Спросить AI"}</span>
                <ChevronRight size={18} />
              </button>
            </div>
            
            <Sparkles className="absolute -right-4 -bottom-4 text-[#00A86B]/10 w-48 h-48 pointer-events-none" />
          </GlassCard>
        </motion.section>

        {/* Action Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5C7A6D]">Сервисы</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <GlassCard onClick={() => nav("/maps")} className="flex flex-col gap-4 aspect-square justify-center items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <MapPin size={28} />
                </div>
                <span className="font-bold text-sm uppercase tracking-wider">{t("nav.map")}</span>
             </GlassCard>

             <GlassCard onClick={() => nav("/scanner")} className="flex flex-col gap-4 aspect-square justify-center items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                  <Camera size={28} />
                </div>
                <span className="font-bold text-sm uppercase tracking-wider">{t("home.translate_photo")}</span>
             </GlassCard>

             <GlassCard onClick={() => nav("/jobs-test")} className="col-span-2 flex items-center gap-5 p-6">
                <div className="w-14 h-14 rounded-2xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B] border border-[#00A86B]/20">
                  <Briefcase size={28} />
                </div>
                <div className="text-left">
                  <span className="block font-black text-sm uppercase tracking-wider">{t("nav.jobs")}</span>
                  <span className="text-[10px] text-[#5C7A6D] font-bold uppercase">Поиск по всей России</span>
                </div>
                <ChevronRight className="ml-auto text-white/20" size={20} />
             </GlassCard>
          </div>
        </section>

        {/* Decorative elements */}
        <p className="mt-12 text-center text-[9px] font-black uppercase tracking-[0.3em] text-[#5C7A6D]/40">
          VAQTA Intelligence System v4.0
        </p>
      </main>

      <BottomNav />
    </div>
  );
}