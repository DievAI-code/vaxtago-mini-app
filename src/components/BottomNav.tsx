"use client";

import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Scan, Sparkles, Briefcase, User } from "lucide-react";

const ITEMS = [
  { path: "/home", icon: LayoutGrid, label: "Asosiy" },
  { path: "/scanner", icon: Scan, label: "Skaner" },
  { path: "/ai", icon: Sparkles, label: "VAQTA AI" },
  { path: "/jobs", icon: Briefcase, label: "Ish" },
  { path: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-around px-4 py-3 bg-[#0C1F1A]/90 backdrop-blur-2xl border border-[#1A3D2E] rounded-[2.5rem] w-[92%] max-w-lg z-50 shadow-2xl">
      {ITEMS.map((item) => {
        const active = loc.pathname === item.path;
        const Icon = item.icon;
        
        return (
          <button
            key={item.path}
            onClick={() => nav(item.path)}
            className="relative flex flex-col items-center gap-1 transition-all duration-300"
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
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
            </motion.div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-[#00A86B]' : 'text-[#5C7A6D]'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}