"use client";

import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Bot, MapPin, User, Camera } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();
  const { t } = useLanguage();

  const ITEMS = [
    { path: "/home", icon: Home, label: t("nav.home") || "Home" },
    { path: "/ai", icon: Bot, label: t("nav.ai") || "AI" },
    { path: "/scanner", icon: Camera, label: t("nav.scanner") || "Scanner" },
    { path: "/maps", icon: MapPin, label: t("nav.map") || "Maps" },
    { path: "/cabinet", icon: User, label: t("nav.profile") || "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-2 z-[100] pointer-events-none pb-safe">
      <nav className="mx-auto flex items-center justify-around px-2 py-3 liquid-glass rounded-full w-full max-w-md pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {ITEMS.map((item) => {
          const active = loc.pathname === item.path || (item.path === "/home" && loc.pathname === "/");
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => nav(item.path)}
              className="relative flex flex-col items-center justify-center p-2 min-w-[64px] outline-none group"
            >
              {active && (
                <motion.div
                  layoutId="active-nav-bg"
                  className="absolute inset-0 bg-[#00A86B]/15 rounded-2xl blur-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <motion.div
                animate={{
                  scale: active ? 1.1 : 1,
                  color: active ? "#00A86B" : "#8E8E93",
                }}
                className="relative z-10 mb-1"
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              </motion.div>
              <span
                className={cn(
                  "text-[10px] font-bold tracking-tight relative z-10 transition-colors duration-300",
                  active ? "text-[#00A86B]" : "text-[#8E8E93]"
                )}
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