"use client";

import { useNavigate } from "react-router-dom";
import { ChevronLeft, Menu, Bell } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { motion } from "framer-motion";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onMenuClick?: () => void;
}

export function Header({ title, showBack = false, onMenuClick }: HeaderProps) {
  const nav = useNavigate();
  const { t } = useLanguage();

  return (
    <header className="p-4 flex items-center justify-between sticky top-0 bg-[#06140F]/80 backdrop-blur-md z-50 safe-top border-b border-[#1A3D2E]">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button 
            onClick={() => nav(-1)}
            className="p-2 bg-[#0C1F1A] border border-[#1A3D2E] rounded-xl text-[#5C7A6D] active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <button 
            onClick={onMenuClick}
            className="p-2 bg-[#0C1F1A] border border-[#1A3D2E] rounded-xl text-[#00A86B] active:scale-90 transition-transform"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="text-lg font-black tracking-tight text-white uppercase">{t(title)}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <button className="p-2 bg-[#0C1F1A] border border-[#1A3D2E] rounded-xl text-[#5C7A6D] relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#00A86B] rounded-full border border-[#06140F]" />
        </button>
      </div>
    </header>
  );
}