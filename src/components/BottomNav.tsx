"use client";

import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Scan, Sparkles, Search, User } from "lucide-react";
import { useTranslation } from "react-i18next";

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();
  const { t } = useTranslation();

  const ITEMS = [
    { path: "/home", icon: LayoutGrid, label: t("nav_home") },
    { path: "/scanner", icon: Scan, label: t("nav_scanner") },
    { path: "/ai", icon: Sparkles, label: t("nav_ai") },
    { path: "/jobs", icon: Search, label: t("nav_jobs") },
    { path: "/profile", icon: User, label: t("nav_profile") },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 z-[100] pointer-events-none">
      <nav className="mx-auto flex items-center justify-around px-4 py-3 bg-[#0C1F1A]/95 backdrop-blur-3xl border border-[#1A3D2E] rounded-[2.5rem] w-full max-w-lg pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {ITEMS.map((item) => {
          const active = loc.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => nav(item.path)}
              className="relative flex flex-col items-center gap-1 transition-all duration-300 min-w-[60px] outline-none active:scale-90"
            >
              {active && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute -inset-2 bg-[#00A86B]/15 rounded-2xl blur-md"
                />
              )}
              <motion.div
                animate={{ 
                  scale: active ? 1.2 : 1,
                  color: active ? "#00A86B" : "#5C7A6D"
                }}
                className="relative"
              >
                <Icon size={22} strokeWidth={active ? 3 : 2} />
              </motion.div>
              <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${active ? 'text-[#00A86B]' : 'text-[#5C7A6D]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      {/* Safe Area Spacer */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}