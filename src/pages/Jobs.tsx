"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, MapPin, Wallet, Clock, ShieldCheck, ShieldAlert, Cpu, Filter } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { FadeUp, stagger, fadeUp } from "@/components/animations";

export default function Jobs() {
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAiSearch = () => {
    if (!query) return;
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6 border-b border-[#00A86B]/10">
        <h1 className="text-xl font-black italic">ISH <span className="text-[#00A86B]">QIDIRISH</span></h1>
      </header>

      <main className="px-6 py-8 space-y-8">
        {/* AI Natural Language Search */}
        <FadeUp>
          <div className="ai-glass p-6 rounded-[2.5rem] space-y-4">
            <div className="flex items-center gap-2 text-[#00A86B]">
              <Cpu size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Smart AI Search</span>
            </div>
            <div className="relative">
              <textarea 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Masalan: Moskvada payvandchi bo'lib ishlash, yotoqxona bilan..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:border-[#00A86B] outline-none min-h-[100px] resize-none"
              />
              <button 
                onClick={handleAiSearch}
                className="absolute bottom-3 right-3 p-3 vaqta-gradient rounded-xl shadow-lg"
              >
                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              </button>
            </div>
          </div>
        </FadeUp>

        {/* Job List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#D4AF37]">Vakansiyalar</h3>
            <Filter size={18} className="text-slate-500" />
          </div>

          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {[1, 2, 3].map((v) => (
              <motion.div key={v} variants={fadeUp} className="ai-card p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-black text-sm uppercase tracking-tight">Payvandchi (Svarshik)</h4>
                    <p className="text-[10px] text-[#00A86B] font-bold">StroyTekh LLC <span className="text-slate-600 font-normal">| Verified</span></p>
                  </div>
                  <div className="bg-[#00A86B]/10 p-2 rounded-xl text-[#00A86B]">
                    <ShieldCheck size={18} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <MapPin size={12} className="text-[#D4AF37]" /> Moscow
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock size={12} className="text-[#D4AF37]" /> Vaxta 30/15
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#00A86B]">
                    <Wallet size={12} /> 140,000 ₽
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-2">
                  <Button className="flex-1 vaqta-gradient h-10 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    Batafsil
                  </Button>
                  <Button variant="outline" className="h-10 w-12 rounded-xl border-white/10">
                    <Heart size={16} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
import { Loader2, Heart } from "lucide-react";