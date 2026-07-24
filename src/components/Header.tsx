"use client";

import { useNavigate } from "react-router-dom";
import { ChevronLeft, Menu, Bell, User } from "lucide-react";
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
    <header className="p-4 flex items-center justify-between sticky top-0 bg-[#06140F]/60 backdrop-blur-xl z-[90] pt-safe border-b border-white/5">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button 
            onClick={() => nav(-1)}
            className="p-2.5 liquid-glass rounded-xl text-slate-300 active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <button 
            onClick={onMenuClick}
            className="p-2.5 liquid-glass rounded-xl text-[#00A86B] active:scale-90 transition-transform"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="text-sm font-black tracking-[0.1em] text-white uppercase ml-1">
          {title.includes('.') ? t(title) : title}
        </h1>
      </div>
      
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <button 
          onClick={() => nav("/cabinet")}
          className="p-2.5 liquid-glass rounded-xl text-slate-400 relative active:scale-90 transition-all"
        >
          <User size={20} />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#00A86B] rounded-full border-2 border-[#06140F]" />
        </button>
      </div>
    </header>
  );
}