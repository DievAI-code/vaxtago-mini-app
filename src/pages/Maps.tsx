"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { VaqtaMap } from "@/components/maps/VaqtaMap";
import { useLanguage } from "@/context/LanguageProvider";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function MapsPage() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const search = searchParams.get("search");
    const route = searchParams.get("route");

    if (search) {
      setSearchQuery(search);
    } else if (route) {
      setSearchQuery(route);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="nav.map" onMenuClick={() => setIsMenuOpen(true)} showBack />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#00A86B]/10 text-[#00A86B] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#00A86B]/20 mb-2">
              <Sparkles size={12} /> VAQTA Maps AI
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {searchQuery ? `Карта: ${searchQuery}` : "Интерактивная карта"}
            </h1>
          </div>
          <button
            onClick={() => nav("/ai")}
            className="p-3 bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl text-[#00A86B] hover:scale-105 active:scale-95 transition-all"
            title="Вернуться к AI чату"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        <VaqtaMap searchQuery={searchQuery} />

        <div className="vaqta-glass p-6 border-[#1A3D2E] space-y-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <span>💡</span> Команды для управления картой через AI:
          </h3>
          <ul className="text-xs text-[#5C7A6D] space-y-2 font-medium">
            <li className="flex items-center gap-2">
              <span className="text-[#00A86B]">RU:</span> "Покажи железнодорожный вокзал в Тюмени"
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#00A86B]">UZ:</span> "Toshkent aeroportini kartada ko'rsat"
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#00A86B]">EN:</span> "Build route to Sheremetyevo airport"
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#00A86B]">TJ:</span> "Построй маршрут до миграционного центра"
            </li>
          </ul>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}