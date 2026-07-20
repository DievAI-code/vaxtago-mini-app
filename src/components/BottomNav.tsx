import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Briefcase, Sparkles, Camera, FileText, User } from "lucide-react";

const ITEMS = [
  { path: "/home", icon: Home, label: "Главная" },
  { path: "/jobs", icon: Briefcase, label: "Вакансии" },
  { path: "/ai", icon: Sparkles, label: "AI" },
  { path: "/photo-translator", icon: Camera, label: "Фото" },
  { path: "/documents", icon: FileText, label: "Документы" },
  { path: "/profile", icon: User, label: "Профиль" },
];

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();
  return (
    <nav className="flex-shrink-0 flex items-center justify-around px-1 py-2 bg-[#080B14]/90 backdrop-blur-xl border-t border-white/10">
      {ITEMS.map((item) => {
        const active = loc.pathname === item.path;
        const Icon = item.icon;
        return (
          <button key={item.path} onClick={() => nav(item.path)} className="relative flex flex-col items-center gap-1 px-2 py-1" aria-label={item.label}>
            {active && (
              <motion.div layoutId="nav-glow" className="absolute -top-1 w-10 h-10 rounded-full bg-[#2563EB]/20 blur-md" transition={{ type: "spring", stiffness: 300, damping: 20 }} />
            )}
            <motion.div animate={{ scale: active ? 1.2 : 1, y: active ? -2 : 0 }} className={active ? "vg-gradient-text" : "text-slate-400"}>
              <Icon className="w-5 h-5" />
            </motion.div>
            <span className={`text-[10px] ${active ? "text-[#7C3AED] font-semibold" : "text-slate-400"}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}