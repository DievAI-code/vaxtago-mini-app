"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  X, Sparkles, Camera, Briefcase, Crown, Settings as SettingsIcon,
  Home as HomeIcon, MapPin, UserCircle, Calendar, ShieldAlert
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
    { path: "/scanner", icon: Camera, label: "nav.scanner" },
    { path: "/jobs-test", icon: Briefcase, label: "nav.jobs" },
    { path: "/maps", icon: MapPin, label: "nav.map" },
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[80%] max-w-xs bg-[#06140F] border-r border-[#1A3D2E] z-[101] flex flex-col shadow-2xl"
          >
            <div className="p-5 flex items-center justify-between border-b border-[#1A3D2E]">
              <div className="flex items-center gap-3">
                <VaqtaLogo size={32} animated />
                <span className="font-black text-white tracking-tighter">
                  VAQTA <span className="text-[#00A86B]">AI</span>
                </span>
              </div>
              <button type="button" onClick={onClose} className="p-2 text-[#5C7A6D]" aria-label="Close">
                <X size={22} />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-[#1A3D2E]">
              <LanguageSwitcher />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    nav(item.path);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                    loc.pathname === item.path
                      ? "bg-[#00A86B]/10 text-[#00A86B] border border-[#00A86B]/20"
                      : "text-[#5C7A6D] hover:bg-white/5"
                  }`}
                >
                  <item.icon size={18} strokeWidth={loc.pathname === item.path ? 2.8 : 2} />
                  <span className="font-bold text-xs uppercase tracking-widest">{t(item.label)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}