"use client";

import { useState, useCallback } from "react";
import { Search, ShieldCheck, MapPin, DollarSign, Sparkles, Filter, Briefcase, Zap, Star } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";
import { motion } from "framer-motion";

export default function Jobs() {
  const [query, setInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6">
        <h1 className="text-2xl font-bold tracking-tight">AI Ish qidirish</h1>
        <p className="text-[#5C7A6D] text-xs font-black uppercase tracking-widest mt-1">Siz yozing, AI filtrlarni topadi</p>
      </header>

      <main className="px-6 space-y-8">
        <FadeUp>
          <div className="relative vaqta-glass border-[#00A86B]/20 p-2 focus-within:border-[#00A86B]/40 transition-all shadow-xl">
            <div className="flex items-center gap-3 px-4">
              <Sparkles size={20} className="text-[#00A86B]" />
              <input 
                type="text"
                value={query}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Menga Moskvada haydovchi ish kerak..."
                className="flex-1 bg-transparent py-4 text-sm outline-none placeholder-[#5C7A6D] font-medium"
              />
              <button onClick={handleSearch} className="bg-[#00A86B] p-3 rounded-2xl shadow-lg hover:scale-105 transition-transform">
                <Search size={20} />
              </button>
            </div>
            {isSearching && <div className="absolute bottom-0 left-0 h-0.5 bg-[#00A86B] ai-shimmer w-full" />}
          </div>
        </FadeUp>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5C7A6D]">AI tomonidan tekshirilgan</h3>
            <Filter size={16} className="text-[#5C7A6D]" />
          </div>
          
          <div className="space-y-4">
            {[
              { title: "Payvandchi (Argon)", co: "TransNeft Pro", city: "Surgut", pay: "140,000", risk: "Safe", rating: 4.8 },
              { title: "Yuk mashinasi haydovchisi", co: "Logistic UZ", city: "Moskva", pay: "105,000", risk: "Safe", rating: 4.5 }
            ].map((j, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, borderColor: "#00A86B44" }} 
                className="vaqta-glass p-6 border-[#1A3D2E] transition-all relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg leading-tight tracking-tight">{j.title}</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[#5C7A6D]">{j.co}</p>
                      <div className="flex items-center gap-0.5 text-[#D4AF37]">
                        <Star size={10} fill="#D4AF37" />
                        <span className="text-[10px] font-black">{j.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#00A86B]/10 text-[#00A86B] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-[#00A86B]/20">
                    <ShieldCheck size={12} /> {j.risk}
                  </div>
                </div>
                
                <div className="flex gap-4 text-xs text-[#5C7A6D] mb-6 relative z-10">
                  <div className="flex items-center gap-1.5 font-bold"><MapPin size={14}/> {j.city}</div>
                  <div className="flex items-center gap-1.5 text-[#00A86B] font-black"><DollarSign size={14}/> {j.pay} rub</div>
                </div>

                <div className="flex gap-3 relative z-10">
                  <button className="flex-1 h-12 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#00A86B] hover:text-white transition-colors">Batafsil</button>
                  <button className="w-12 h-12 vaqta-glass border-[#1A3D2E] flex items-center justify-center text-[#5C7A6D] hover:text-[#00A86B] transition-colors">
                    <Briefcase size={20} />
                  </button>
                </div>
                <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                  <Zap size={80} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}