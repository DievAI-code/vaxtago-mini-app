"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { Globe, Moon, Shield, Bell, HelpCircle, ChevronRight, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { Lang } from "@/i18n";

const LANGUAGES: { code: Lang; name: string; flag: string }[] = [
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "uz", name: "O'zbekcha", flag: "🇺🇿" },
  { code: "tg", name: "Тоҷикӣ", flag: "🇹🇯" },
];

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="nav.settings" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="px-6 space-y-6 mt-4 flex-1">
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">Язык интерфейса</h3>
          <div className="space-y-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`w-full vaqta-glass p-4 flex items-center justify-between transition-all ${
                  language === l.code ? "border-[#00A86B] bg-[#00A86B]/10" : "border-[#1A3D2E]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{l.flag}</span>
                  <span className="font-bold text-sm">{l.name}</span>
                </div>
                {language === l.code && <Check size={18} className="text-[#00A86B]" />}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3 pt-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">Система</h3>
          <div className="space-y-2">
            <div className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-[#00A86B]" />
                <span className="font-bold text-sm">Уведомления</span>
              </div>
              <span className="text-xs font-bold text-[#00A86B]">Включено</span>
            </div>

            <div className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-[#D4AF37]" />
                <span className="font-bold text-sm">Конфиденциальность</span>
              </div>
              <ChevronRight size={18} className="text-[#5C7A6D]" />
            </div>
          </div>
        </section>

        <div className="pt-8 text-center text-xs text-[#5C7A6D] font-mono">
          <p>VAQTA AI v3.0 Production</p>
          <p className="text-[10px] mt-1">OpenStreetMap & Supabase Enabled</p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}