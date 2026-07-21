"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Scan, Sparkles, ShieldCheck, Briefcase, ChevronRight, Globe, Zap } from "lucide-react";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp, stagger, fadeUp } from "@/components/animations";

export default function Index() {
  const nav = useNavigate();

  const ACTIONS = [
    { 
      title: "AI Skaner", 
      desc: "Hujjatlarni tarjima qilish", 
      icon: <Scan className="text-[#00A86B]" />, 
      path: "/scanner",
      color: "from-[#00A86B]/20"
    },
    { 
      title: "AI Job Check", 
      desc: "Vakansiya xavfini tekshirish", 
      icon: <ShieldCheck className="text-[#D4AF37]" />, 
      path: "/jobs",
      color: "from-[#D4AF37]/20"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <VaqtaLogo size={36} animated />
          <h1 className="text-2xl font-black tracking-tighter">VAQTA <span className="vaqta-gold-text">AI</span></h1>
        </div>
        <div className="flex items-center gap-2 bg-[#0C1F1A] border border-[#1A3D2E] px-3 py-1.5 rounded-full">
          <Globe size={14} className="text-[#00A86B]" />
          <span className="text-xs font-bold uppercase">UZB</span>
        </div>
      </header>

      <main className="px-6 space-y-8">
        {/* Main Hero AI */}
        <FadeUp>
          <div 
            onClick={() => nav("/ai")}
            className="vaqta-glass p-8 relative overflow-hidden group cursor-pointer border-[#00A86B]/30 vaqta-glow"
          >
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#00A86B]/20 text-[#00A86B] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={12} /> Next-Gen Assistant
              </div>
              <h2 className="text-3xl font-bold leading-tight">
                Chet elda ish topishga <br/> <span className="text-[#00A86B]">AI yordam beradi</span>
              </h2>
              <p className="text-sm text-[#5C7A6D] max-w-[240px]">
                Hujjatlarni skanerlang, vakansiyalarni tekshiring va savollaringizga javob oling.
              </p>
              <div className="flex items-center gap-2 text-white font-bold group-hover:translate-x-2 transition-transform">
                VAQTA AI bilan gaplashish <ChevronRight size={18} className="text-[#D4AF37]" />
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Sparkles size={200} color="#00A86B" />
            </div>
            <div className="absolute top-0 left-0 w-full h-full ai-shimmer opacity-30" />
          </div>
        </FadeUp>

        <section className="grid grid-cols-2 gap-4">
          {ACTIONS.map((action) => (
            <motion.div
              key={action.title}
              whileHover={{ y: -5 }}
              onClick={() => nav(action.path)}
              className={`vaqta-glass p-5 bg-gradient-to-br ${action.color} to-transparent cursor-pointer border-[#1A3D2E]`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#06140F] border border-[#1A3D2E] flex items-center justify-center mb-4 shadow-xl">
                {action.icon}
              </div>
              <h3 className="font-bold text-sm">{action.title}</h3>
              <p className="text-[10px] text-[#5C7A6D] mt-1">{action.desc}</p>
            </motion.div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#5C7A6D]">AI Analitika</h3>
          </div>
          <div className="vaqta-glass p-6 border-dashed border-[#1A3D2E]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                  <Zap size={20} className="text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#5C7A6D]">Haftalik xulosa</p>
                  <p className="text-sm font-bold">Rossiya & BAA bozori</p>
                </div>
              </div>
              <span className="text-[#00A86B] text-xs font-black">+12%</span>
            </div>
            <p className="text-xs text-[#5C7A6D] leading-relaxed">
              AI tahlili shuni ko'rsatadiki, hozirda qurilish va logistika sohasida talab ortib bormoqda.
            </p>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}