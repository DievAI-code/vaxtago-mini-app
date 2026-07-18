import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { VHome, VBrain, VCareer, VDocument, VIdentity } from "./icons/VaxtaGoIcons";

const ITEMS = [
  { path: "/", icon: VHome, label: "Главная" },
  { path: "/chat", icon: VBrain, label: "AI" },
  { path: "/jobs", icon: VCareer, label: "Работа" },
  { path: "/scanner", icon: VDocument, label: "Документы" },
  { path: "/profile", icon: VIdentity, label: "Профиль" },
];

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();
  return (
    <nav className="flex-shrink-0 flex items-center justify-around px-2 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
      {ITEMS.map((item) => {
        const active = loc.pathname === item.path;
        const Icon = item.icon;
        return (
          <button key={item.path} onClick={() => nav(item.path)} className="relative flex flex-col items-center gap-1 px-3 py-1">
            {active && (
              <motion.div layoutId="nav-glow" className="absolute -top-1 w-10 h-10 rounded-full bg-blue-500/20 blur-md" transition={{ type: "spring", stiffness: 300, damping: 20 }} />
            )}
            <motion.div animate={{ scale: active ? 1.2 : 1, y: active ? -2 : 0 }} className={active ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}>
              <Icon className="w-6 h-6" />
            </motion.div>
            <span className={`text-[10px] ${active ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-400"}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}