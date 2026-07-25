"use client";

import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Bot, MapPin, Camera, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();
  const { t } = useLanguage();

  const ITEMS = [
    { path: "/home", icon: Home, label: "nav.home" },
    { path: "/ai", icon: Bot, label: "nav.ai" },
    { path: "/maps", icon: MapPin, label: "nav.map" },
    { path: "/scanner", icon: Camera, label: "nav.scanner" },
    { path: "/cabinet", icon: User, label: "nav.profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 px-6 pb-6 pt-2 z-[100] pointer-events-none pb-safe">
      <nav className="mx-auto flex items-center justify-around px-4 py-4 liquid-glass rounded-full w-full max-w-md pointer-events-auto shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {ITEMS.map((item) => {
          const active = loc.pathname === item.path || (item.path === "/home" && loc.pathname === "/");
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => nav(item.path)}
              className="relative flex flex-col items-center justify-center p-2 outline-none group"
            >
              {active && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-[#0AA86E]/20 rounded-2xl blur-md"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <motion.div
                animate={{
                  scale: active ? 1.15 : 1,
                  color: active ? "#0AA86E" : "#8E8E93",
                }}
                className="relative z-10"
              >
                <Icon size={24} strokeWidth={active ? 2.8 : 2} />
              </motion.div>
              {active && (
                <motion.span 
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[9px] font-black uppercase tracking-widest text-[#0AA86E] absolute -bottom-3"
                >
                  {t(item.label).split(' ')[0]}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}