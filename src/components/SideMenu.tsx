"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  X, LayoutGrid, Sparkles, Scan, Search, User, 
  Clock, Crown, Settings, Info, Mail, ShieldCheck 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { VaqtaLogo } from "./VaqtaLogo";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const nav = useNavigate();
  const loc = useLocation();
  const { t } = useLanguage();

  const MENU_ITEMS = [
    { path: "/home", icon: LayoutGrid, label: "nav.home" },
    { path: "/ai", icon: Sparkles, label: "nav.ai" },
    { path: "/scanner", icon: Scan, label: "nav.scanner" },
    { path: "/jobs", icon: Search, label: "nav.jobs" },
    { path: "/profile", icon: User, label: "nav.profile" },
    { separator: true },
    { path: "/history", icon: Clock, label: "nav.history" },
    { path: "/premium", icon: Crown, label: "nav.premium" },
    { path: "/settings", icon: Settings, label: "nav.settings" },
    { separator: true },
    { path: "/about", icon: Info, label: "nav.about" },
    { path: "/contacts", icon: Mail, label: "nav.contacts" },
    { path: "/policy", icon: NavPolicy, label: "nav.policy" },
  ];

  function NavPolicy(props: any) { return <ShieldCheck {...props} />; }

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
            className="fixed inset-y-0 left-0 w-[80%] max-w-sm bg-[#06140F] border-r border-[#1A3D2E] z-[101] flex flex-col shadow-2xl"
          >
            <div className="p-6 flex items-center justify-between border-b border-[#1A3D2E]">
              <div className="flex items-center gap-3">
                <VaqtaLogo size={32} animated />
                <span className="font-black text-white tracking-tighter">VAQTA <span className="text-[#00A86B]">AI</span></span>
              </div>
              <button onClick={onClose} className="p-2 text-[#5C7A6D]"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
              {MENU_ITEMS.map((item, idx) => (
                item.separator ? (
                  <div key={`sep-${idx}`} className="h-px bg-[#1A3D2E] my-4 mx-2" />
                ) : (
                  <button
                    key={item.path}
                    onClick={() => { nav(item.path!); onClose(); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      loc.pathname === item.path 
                        ? "bg-[#00A86B]/10 text-[#00A86B] border border-[#00A86B]/20" 
                        : "text-[#5C7A6D] hover:bg-white/5"
                    }`}
                  >
                    <item.icon size={20} strokeWidth={loc.pathname === item.path ? 3 : 2} />
                    <span className="font-bold text-sm uppercase tracking-widest">{t(item.label!)}</span>
                  </button>
                )
              ))}
            </div>

            <div className="p-6 border-t border-[#1A3D2E]">
               <div className="flex items-center gap-4 p-4 vaqta-glass border-[#D4AF37]/20">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                    <Crown size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase text-[#D4AF37]">VaxtaGo Premium</p>
                    <p className="text-xs text-[#5C7A6D] truncate">v3.0 Production</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}