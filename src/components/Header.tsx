"use client";

import { useNavigate } from "react-router-dom";
import { ChevronLeft, Menu, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onMenuClick?: () => void;
}

export function Header({ title, showBack = false, onMenuClick }: HeaderProps) {
  const nav = useNavigate();
  const { t } = useLanguage();

  return (
    <header className="px-4 py-3.5 flex items-center justify-between sticky top-0 bg-[#06140F]/85 backdrop-blur-xl z-[90] border-b border-white/10" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}>
      <div className="flex items-center gap-3">
        {showBack ? (
          <button 
            type="button"
            onClick={() => nav(-1)}
            className="p-2.5 liquid-glass rounded-2xl text-slate-200 active:scale-90 transition-transform"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <button 
            type="button"
            onClick={onMenuClick}
            className="p-2.5 liquid-glass rounded-2xl text-[#00A86B] active:scale-90 transition-transform"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="text-xs sm:text-sm font-black tracking-[0.12em] text-white uppercase truncate max-w-[140px] sm:max-w-none">
          {title.includes(".") ? t(title) : title}
        </h1>
      </div>
      
      <div className="flex items-center gap-2.5">
        <LanguageSwitcher />
        <button 
          type="button"
          onClick={() => nav("/cabinet")}
          className="p-2.5 liquid-glass rounded-2xl text-slate-300 relative active:scale-90 transition-all"
          aria-label="Cabinet"
        >
          <User size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#00A86B] rounded-full border-2 border-[#06140F]" />
        </button>
      </div>
    </header>
  );
}