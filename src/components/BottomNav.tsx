"use client";

import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Scan, Cpu, Briefcase, User } from "lucide-react";

const ITEMS = [
  { path: "/home", icon: LayoutDashboard, label: "Asosiy" },
  { path: "/scanner", icon: Scan, label: "Skaner" },
  { path: "/ai", icon: Cpu, label: "VAQTA AI" },
  { path: "/jobs", icon: Briefcase, label: "Ish" },
  { path: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-around p-2 bg-[#081C16]/80 backdrop-blur-3xl border border-[#00A86B]/20 rounded-full w-[94%] max-w-lg z-50 shadow-2xl">
      {ITEMS.map((item) => {
        const active = loc.pathname === item.path;
        const Icon = item.icon;
        
        return (
          <button
            key={item.path}
            onClick={() => nav(item.path)}
            className="relative flex flex-col items-center gap-1 py-3 px-4 transition-all duration-300"
          >
            {active && (
              <motion.div
                layoutId="nav-glow"
                className="absolute inset-0 bg-[#00A86B]/10 rounded-full border border-[#00A86B]/20"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <motion.div
              animate={{ 
                scale: active ? 1.2 : 1,
                color: active ? "#00A86B" : "#A1A1AA"
              }}
              className="relative z-10"
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            </motion.div>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${active ? "text-[#00A86B]" : "text-[#A1A1AA]"}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}