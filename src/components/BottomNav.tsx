"use client";

import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Scan, Sparkles, MapPin, Key } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();
  const { t } = useLanguage();

  const ITEMS = [
    { path: "/home", icon: LayoutGrid, label: t("nav.home") },
    { path: "/ai", icon: Sparkles, label: t("nav.ai") },
    { path: "/scanner", icon: Scan, label: t("nav.scanner") },
    { path: "/maps", icon: MapPin, label: t("nav.map") },
    { path: "/admin/login", icon: Key, label: t("nav.admin") },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-[100] pointer-events-none pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <nav className="mx-auto flex items-center justify-around px-1 py-2.5 bg-[#0C1F1A]/95 backdrop-blur-3xl border border-[#1A3D2E] rounded-[2rem] w-full max-w-lg pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
        {ITEMS.map((item) => {
          const active = loc.pathname === item.path || (item.path === "/home" && loc.pathname === "/");
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => nav(item.path)}
              className="relative flex flex-col items-center gap-1 transition-all duration-300 min-w-[56px] outline-none active:scale-90"
            >
              {active && (
                <motion.div
                  layoutId="nav-glow-active"
                  className="absolute -inset-1.5 bg-[#00A86B]/20 rounded-2xl blur-md"
                />
              )}
              <motion.div
                animate={{
                  scale: active ? 1.15 : 1,
                  color: active ? "#00A86B" : "#5C7A6D",
                }}
                className="relative z-10"
              >
                <Icon size={20} strokeWidth={active ? 2.8 : 2} />
              </motion.div>
              <span
                className={`text-[9px] font-black uppercase tracking-tight transition-colors relative z-10 ${
                  active ? "text-[#00A86B]" : "text-[#5C7A6D]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
