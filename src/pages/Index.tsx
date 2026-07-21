"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Camera, Sparkles, ShieldCheck, MessageSquare, ChevronRight, Globe, Zap, ArrowRight } from "lucide-react";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";

export default function Index() {
  const nav = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6 flex items-center justify-between sticky top-0 bg-[#06140F]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <VaqtaLogo size={36} animated />
          <h1 className="text-2xl font-black tracking-tighter">VAQTA <span className="vaqta-gold-text">AI</span></h1>
        </div>
        <div className="flex items-center gap-2 bg-[#0C1F1A] border border-[#1A3D2E] px-4 py-2 rounded-full">
          <Globe size={14} className="text-[#00A86B]" />
          <span className="text-[10px] font-black uppercase tracking-widest">UZBEKISTAN</span>
        </div>
      </header>

      <main className="px-6 space-y-8 mt-4">
        {/* Main Hero AI */}
        <FadeUp>
          <div className="relative group overflow-hidden rounded-[3rem] p-1 bg-gradient-to-br from-[#00A86B]/40 to-transparent">
            <div className="bg-[#06140F] rounded-[2.9rem] p-8 space-y-6 relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 bg-[#00A86B]/10 text-[#00A86B] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#00A86B]/20">
                  <Sparkles size={12} /> Rasm yuboring. Biz tushuntiramiz.
                </div>
                <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">
                  Ish va hayot uchun <br/> 
                  <span className="vaqta-gold-text">aqlli yordamchi</span>
                </h2>
                
                <div className="grid grid-cols-2 gap-2 py-4">
                  {["Tarjima", "Hujjat tekshirish", "Ish topish", "Xavfsizlik"].map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-[#5C7A6D] font-bold">
                      <Zap size={12} className="text-[#00A86B]" /> {item}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <motion.button 
                    whileTap={{ scale: 0.97 }}
                    onClick={() => nav("/scanner")}
                    className="w-full h-16 rounded-2xl vaqta-gradient flex items-center justify-center gap-3 text-lg font-black shadow-xl vaqta-glow"
                  >
                    <Camera size={24} /> Rasm yuklash
                  </motion.button>
                  
                  <motion.button 
                    whileTap={{ scale: 0.97 }}
                    onClick={() => nav("/ai")}
                    className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-lg font-bold"
                  >
                    <MessageSquare size={20} className="text-[#00A86B]" /> AI bilan gaplashish
                  </motion.button>
                </div>
              </div>
              
              <div className="absolute -right-20 -bottom-20 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <Sparkles size={300} color="#00A86B" />
              </div>
              <div className="absolute top-0 left-0 w-full h-full ai-shimmer opacity-20 pointer-events-none" />
            </div>
          </div>
        </FadeUp>

        {/* Quick Features */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D]">Xizmatlar</h3>
            <span className="text-[10px] font-black text-[#00A86B]">Hammasi →</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => nav("/jobs")} className="vaqta-glass p-6 space-y-4 cursor-pointer hover:border-[#00A86B]/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#00A86B]/10 flex items-center justify-center">
                <ShieldCheck className="text-[#00A86B]" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">AI Job Check</h4>
                <p className="text-[10px] text-[#5C7A6D] mt-1">Vakansiya xavfini tekshirish</p>
              </div>
            </div>

            <div onClick={() => nav("/scanner")} className="vaqta-glass p-6 space-y-4 cursor-pointer hover:border-[#D4AF37]/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
                <ArrowRight className="text-[#D4AF37]" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">AI Translator</h4>
                <p className="text-[10px] text-[#5C7A6D] mt-1">Hujjatlarni tarjima qilish</p>
              </div>
            </div>
          </div>
        </section>

        {/* Analytics Card */}
        <section className="vaqta-glass p-8 border-dashed border-[#1A3D2E] relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#5C7A6D] uppercase tracking-widest">Bozor tahlili</p>
                <p className="text-sm font-bold">Rossiya & BAA bozori</p>
              </div>
            </div>
            <div className="text-[#00A86B] text-xs font-black bg-[#00A86B]/10 px-2 py-1 rounded-lg">+12%</div>
          </div>
          <p className="text-xs text-[#5C7A6D] leading-relaxed font-medium">
            AI tahlili shuni ko'rsatadiki, hozirda qurilish va logistika sohasida talab ortib bormoqda. Eng xavfsiz vakansiyalar Moskva va Dubay shaharlarida.
          </p>
          <div className="absolute top-0 left-0 w-full h-full ai-shimmer opacity-5 pointer-events-none" />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}