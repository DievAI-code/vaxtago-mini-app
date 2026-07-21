"use client";

import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Scan, Sparkles, Search, User } from "lucide-react";

const ITEMS = [
  { path: "/home", icon: LayoutGrid, label: "Bosh sahifa" },
  { path: "/scanner", icon: Scan, label: "Skaner" },
  { path: "/ai", icon: Sparkles, label: "VAQTA AI" },
  { path: "/jobs", icon: Search, label: "Ish" },
  { path: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-around px-4 py-3 bg-[#0C1F1A]/90 backdrop-blur-3xl border border-[#1A3D2E] rounded-[2.5rem] w-[94%] max-w-lg z-50 shadow-2xl shadow-black/50">
      {ITEMS.map((item) => {
        const active = loc.pathname === item.path;
        const Icon = item.icon;
        
        return (
          <button
            key={item.path}
            onClick={() => nav(item.path)}
            className="relative flex flex-col items-center gap-1.5 transition-all duration-300 min-w-[64px]"
          >
            {active && (
              <motion.div
                layoutId="nav-glow"
                className="absolute -inset-2 bg-[#00A86B]/10 rounded-2xl blur-md"
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
              {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#00A86B] rounded-full" />}
            </motion.div>
            <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${active ? 'text-[#00A86B]' : 'text-[#5C7A6D]'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}