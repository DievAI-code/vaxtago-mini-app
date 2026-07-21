"use client";

import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Sparkles, Heart, User } from "lucide-react";

const ITEMS = [
  { path: "/home", icon: Home, label: "Главная" },
  { path: "/jobs", icon: Search, label: "Поиск" },
  { path: "/ai", icon: Sparkles, label: "AI" },
  { path: "/history", icon: Heart, label: "Избранное" },
  { path: "/profile", icon: User, label: "Профиль" },
];

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-around px-2 py-2 bg-[#18181B]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] w-[90%] max-w-md z-50">
      {ITEMS.map((item) => {
        const active = loc.pathname === item.path;
        const Icon = item.icon;
        
        return (
          <button
            key={item.path}
            onClick={() => nav(item.path)}
            className="relative flex flex-col items-center gap-1 p-3 transition-colors"
            aria-label={item.label}
          >
            {active && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 bg-white/5 rounded-2xl"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <motion.div
              animate={{ 
                scale: active ? 1.1 : 1,
                color: active ? "#FAFAFA" : "#A1A1AA"
              }}
              className="relative z-10"
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            </motion.div>
            {active && (
              <motion.div 
                layoutId="nav-dot"
                className="w-1 h-1 rounded-full bg-[#2563EB] absolute -bottom-1"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}