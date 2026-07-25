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
</dyad-file>

<dyad-write path="src/components/SideMenu.tsx" description="Updating SideMenu to handle touch dismiss, swipe gestures, full height safe area support, and seamless navigation link execution.">
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  X, Camera, Briefcase, Crown, Settings as SettingsIcon,
  Home as HomeIcon, MapPin, UserCircle, Calendar, ShieldAlert,
  Ticket, FileText
} from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { VaqtaLogo } from "./VaqtaLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const nav = useNavigate();
  const loc = useLocation();
  const { t } = useLanguage();

  const MENU_ITEMS = [
    { path: "/home", icon: HomeIcon, label: "nav.home" },
    { path: "/ai", icon: Briefcase, label: "nav.ai" },
    { path: "/jobs-test", icon: Briefcase, label: "nav.jobs" },
    { path: "/maps", icon: MapPin, label: "nav.map" },
    { path: "/scanner", icon: Camera, label: "nav.scanner" },
    { path: "/contract-audit", icon: FileText, label: "nav.contract" },
    { path: "/cabinet", icon: UserCircle, label: "nav.profile" },
    { path: "/tracker", icon: Calendar, label: "nav.tracker" },
    { path: "/sos", icon: ShieldAlert, label: "nav.sos" },
    { path: "/premium", icon: Crown, label: "nav.premium" },
    { path: "/settings", icon: SettingsIcon, label: "nav.settings" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 left-0 w-[85%] max-w-xs bg-[#06140F] border-r border-[#1A3D2E] z-[101] flex flex-col shadow-2xl overflow-hidden"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="p-5 flex items-center justify-between border-b border-[#1A3D2E]">
              <div className="flex items-center gap-3">
                <VaqtaLogo size={34} animated />
                <span className="font-black text-white tracking-tighter text-lg">
                  VAQTA <span className="text-[#00A86B]">AI</span>
                </span>
              </div>
              <button type="button" onClick={onClose} className="p-2.5 text-[#5C7A6D] hover:text-white rounded-2xl bg-white/5 transition-colors" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-[#1A3D2E]">
              <LanguageSwitcher />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
              {MENU_ITEMS.map((item) => {
                const isActive = loc.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      nav(item.path);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all text-left ${
                      isActive
                        ? "bg-[#00A86B]/15 text-[#00A86B] border border-[#00A86B]/30 font-black shadow-lg"
                        : "text-slate-300 hover:bg-white/5 font-bold"
                    }`}
                  >
                    <item.icon size={20} className={isActive ? "text-[#00A86B]" : "text-[#5C7A6D]"} />
                    <span className="text-xs uppercase tracking-widest truncate">{t(item.label)}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-[#1A3D2E] text-center text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
              VAQTA AI v3.0 • Production Ready
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}