import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { VaxtaGoLogo } from "./VaxtaGoLogo";
import { VBrain, VCareer, VIdentity } from "./icons/VaxtaGoIcons";
import { History } from "lucide-react";

const ITEMS = [
  { path: "/", icon: VaxtaGoLogo, label: "Главная", isLogo: true },
  { path: "/history", icon: History, label: "История" },
  { path: "/jobs", icon: VCareer, label: "Вакансии" },
  { path: "/profile", icon: VIdentity, label: "Профиль" },
];

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();
  return (
    <nav className="flex-shrink-0 flex items-center justify-around px-2 py-2 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
      {ITEMS.map((item) => {
        const active = loc.pathname === item.path;
        const Icon = item.icon;
        return (
          <button key={item.path} onClick={() => nav(item.path)} className="relative flex flex-col items-center gap-1 px-3 py-1" aria-label={item.label}>
            {active && (
              <motion.div layoutId="nav-glow" className="absolute -top-1 w-10 h-10 rounded-full bg-[#2563EB]/20 blur-md" transition={{ type: "spring", stiffness: 300, damping: 20 }} />
            )}
            <motion.div animate={{ scale: active ? 1.2 : 1, y: active ? -2 : 0 }} className={active ? "text-[#2563EB] dark:text-[#06B6D4]" : "text-slate-400"}>
              {item.isLogo ? <Icon size={26} /> : <Icon className="w-6 h-6" />}
            </motion.div>
            <span className={`text-[10px] ${active ? "text-[#2563EB] dark:text-[#06B6D4] font-semibold" : "text-slate-400"}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}