"use client";

import { useState } from "react";
import { Search, Briefcase, ShieldCheck, MapPin, DollarSign, Sparkles, Filter } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { FadeUp } from "@/components/animations";

export default function Jobs() {
  const [query, setInput] = useState("");

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6">
        <h1 className="text-2xl font-bold tracking-tight">AI Ish qidirish</h1>
        <p className="text-[#5C7A6D] text-sm">Oddiy tilda yozing, AI filtrlarni o'zi tanlaydi</p>
      </header>

      <main className="px-6 space-y-8">
        <FadeUp>
          <div className="relative vaqta-glass border-[#00A86B]/20 p-2 focus-within:border-[#00A86B]/50 transition-colors">
            <div className="flex items-center gap-3 px-4">
              <Sparkles size={20} className="text-[#00A86B]" />
              <input 
                type="text"
                value={query}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Masalan: Moskvada haydovchi ish kerak..."
                className="flex-1 bg-transparent py-4 text-sm outline-none placeholder-[#5C7A6D]"
              />
              <button className="bg-[#00A86B] p-2.5 rounded-2xl shadow-lg">
                <Search size={18} />
              </button>
            </div>
          </div>
        </FadeUp>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#5C7A6D]">AI tomonidan tekshirilgan</h3>
            <Filter size={16} className="text-[#5C7A6D]" />
          </div>
          
          <div className="space-y-4">
            {[
              { title: "Svarshik (Elektrogazosvarshik)", co: "TransNeft", city: "Surgut", pay: "120,000", risk: "Low" },
              { title: "Katalog haydovchisi", co: "Logistik Pro", city: "Moskva", pay: "95,000", risk: "Safe" }
            ].map((j, i) => (
              <motion.div key={i} whileHover={{ scale: 1.02 }} className="vaqta-glass p-6 border-[#1A3D2E] hover:border-[#00A86B]/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg leading-tight">{j.title}</h4>
                    <p className="text-xs font-bold text-[#5C7A6D]">{j.co}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-[#00A86B]/10 text-[#00A86B] px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                    <ShieldCheck size={12} /> {j.risk}
                  </div>
                </div>
                
                <div className="flex gap-4 text-xs text-[#5C7A6D] mb-6">
                  <div className="flex items-center gap-1"><MapPin size={14}/> {j.city}</div>
                  <div className="flex items-center gap-1 text-[#00A86B] font-bold"><DollarSign size={14}/> {j.pay} rub</div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 h-12 bg-white text-black rounded-2xl font-bold text-sm">Batafsil</button>
                  <button className="w-12 h-12 vaqta-glass border-[#1A3D2E] flex items-center justify-center">
                    <Briefcase size={18} />
                  </button>
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