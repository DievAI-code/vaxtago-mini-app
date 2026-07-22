"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { Crown, Check, Zap, ShieldCheck, Sparkles, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";

export default function Premium() {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const BENEFITS = [
    "Безлимитные запросы к AI Assistant",
    "Неограниченный сканер и перевод документов",
    "Приоритетный поиск работодателей и рисков",
    "Прямой доступ к онлайн навигатору OpenStreetMap",
    "Персональная юридическая поддержка 24/7"
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="nav.premium" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="px-6 space-y-6 mt-4 flex-1">
        <div className="vaqta-glass p-8 border-[#D4AF37]/30 text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-[#D4AF37]">
            <Crown size={120} />
          </div>
          <div className="w-16 h-16 rounded-3xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto text-[#D4AF37]">
            <Crown size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">VAQTA PREMIUM</h2>
            <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest mt-1">Максимальная защита и скорость</p>
          </div>
          <div className="pt-2">
            <span className="text-3xl font-black">299 ₽</span>
            <span className="text-xs text-[#5C7A6D] font-bold"> / месяц</span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">Преимущества подписки</h3>
          <div className="space-y-2">
            {BENEFITS.map((b, i) => (
              <div key={i} className="vaqta-glass p-4 border-[#1A3D2E] flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#00A86B]/20 text-[#00A86B] flex items-center justify-center flex-shrink-0">
                  <Check size={14} />
                </div>
                <span className="text-xs font-bold text-slate-200">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => toast.success("Запрос на активацию Premium отправлен!")}
          className="w-full h-16 rounded-2xl vaqta-gradient font-black text-white text-lg shadow-xl uppercase tracking-wider vaqta-glow"
        >
          Подключить Premium
        </button>
      </main>

      <BottomNav />
    </div>
  );
}