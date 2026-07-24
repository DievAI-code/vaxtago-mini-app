"use client";

import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Bot, Camera, Briefcase, Crown, Home as HomeIcon } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();
  const { t } = useLanguage();

  const ITEMS = [
    { path: "/home", icon: HomeIcon, label: t("nav.home") || "Bosh sahifa" },
    { path: "/ai", icon: Bot, label: t("nav.ai") || "AI yordamchi" },
    { path: "/scanner", icon: Camera, label: t("nav.scanner") || "Tarjima" },
    { path: "/jobs-test", icon: Briefcase, label: t("nav.jobs") || "Ish" },
    { path: "/premium", icon: Crown, label: t("nav.premium") || "Premium" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-2 z-[100] pointer-events-none pb-safe">
      <nav className="mx-auto flex items-center justify-around px-2 py-2.5 bg-[#0C1F1A]/95 backdrop-blur-3xl border border-[#1A3D2E] rounded-[2.2rem] w-full max-w-md pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
        {ITEMS.map((item) => {
          const active = loc.pathname === item.path || (item.path === "/home" && loc.pathname === "/");
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => nav(item.path)}
              className="relative flex flex-col items-center gap-1 transition-all duration-300 min-w-[54px] outline-none active:scale-90"
            >
              {active && (
                <motion.div
                  layoutId="nav-glow-active"
                  className="absolute -inset-1 bg-[#00A86B]/20 rounded-2xl blur-md"
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
                className={`text-[9px] font-black uppercase tracking-tight transition-colors relative z-10 text-center truncate max-w-[60px] ${
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