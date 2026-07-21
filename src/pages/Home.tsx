"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Scan, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  ChevronRight,
  Globe,
  Sparkles
} from "lucide-react";
import { VaqtaAiLogo } from "@/components/VaqtaAiLogo";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp, stagger, fadeUp } from "@/components/animations";

export default function Home() {
  const nav = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6 flex items-center justify-between sticky top-0 bg-[#06140F]/80 backdrop-blur-md z-40 border-b border-[#00A86B]/10">
        <VaqtaAiLogo size={36} />
        <div className="flex gap-2">
          <div className="bg-[#00A86B]/10 px-3 py-1 rounded-full border border-[#00A86B]/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
            <span className="text-[10px] font-bold text-[#00A86B]">VAQTA ENGINE v4.0</span>
          </div>
        </div>
      </header>

      <main className="px-6 pt-8 space-y-8">
        <FadeUp>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black vaqta-gold-text">AI YORDAMCHI</h2>
            <p className="text-slate-400 text-sm">O'zbekistonliklar uchun xalqaro ish bo'yicha aqlli tizim</p>
          </div>
        </FadeUp>

        {/* AI Scanner Hero */}
        <FadeUp>
          <div 
            onClick={() => nav("/scanner")}
            className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#00A86B] to-[#007A4D] relative overflow-hidden cursor-pointer group shadow-[0_0_40px_-10px_rgba(0,168,107,0.5)]"
          >
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Scan className="text-white" size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">AI Skaner</h3>
                <p className="text-white/80 text-sm">Hujjatlarni rasmga oling, biz tarjima qilib, tushuntirib beramiz</p>
              </div>
              <div className="inline-flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl text-xs font-bold text-white">
                Rasm yuklash <ChevronRight size={14} />
              </div>
            </div>
            <Cpu className="absolute -bottom-10 -right-10 text-white/10 w-48 h-48 rotate-12 group-hover:scale-110 transition-transform duration-700" />
          </div>
        </FadeUp>

        {/* AI Services Grid */}
        <section className="grid grid-cols-2 gap-4">
          <motion.div 
            variants={fadeUp}
            onClick={() => nav("/ai")}
            className="ai-card p-6 space-y-4 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
              <Cpu size={24} />
            </div>
            <h4 className="font-bold text-sm">AI Assistant</h4>
            <p className="text-[10px] text-slate-500">5 xil tilda muloqot va maslahat</p>
          </motion.div>

          <motion.div 
            variants={fadeUp}
            onClick={() => nav("/jobs")}
            className="ai-card p-6 space-y-4 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck size={24} />
            </div>
            <h4 className="font-bold text-sm">AI Tekshiruv</h4>
            <p className="text-[10px] text-slate-500">Vakansiya xavfsizligini aniqlash</p>
          </motion.div>
        </section>

        {/* Feature list */}
        <FadeUp>
          <div className="ai-glass rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Globe className="text-[#00A86B]" size={20} />
              <h4 className="font-bold text-sm uppercase tracking-widest text-[#00A86B]">Platforma afzalliklari</h4>
            </div>
            <div className="space-y-3">
              {[
                { icon: <Zap size={14}/>, text: "Sekundiga 1mln operatsiya" },
                { icon: <Sparkles size={14}/>, text: "Hujjatlarni 100% aniqlash" },
                { icon: <ShieldCheck size={14}/>, text: "Xavfsiz ish beruvchilar" }
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="text-[#D4AF37]">{f.icon}</div>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </main>

      <BottomNav />
    </div>
  );
}