"use client";

import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Bot, MapPin, Camera, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { memo } from "react";

const ITEMS = [
  { path: "/home", icon: Home, label: "nav.home", match: ["/", "/home"] },
  { path: "/ai", icon: Bot, label: "nav.ai", match: ["/ai", "/chat"] },
  { path: "/maps", icon: MapPin, label: "nav.map", match: ["/maps", "/map"] },
  { path: "/scanner", icon: Camera, label: "nav.scanner", match: ["/scanner", "/ocr"] },
  { path: "/cabinet", icon: User, label: "nav.profile", match: ["/cabinet", "/profile"] },
];

const NavButton = memo(function NavButton({ item, active, onClick, label }: { item: typeof ITEMS[0]; active: boolean; onClick: () => void; label: string }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center p-2 outline-none group flex-1"
      aria-label={label}
    >
      {active && (
        <>
          <motion.div
            layoutId="bottom-nav-pill"
            className="absolute inset-x-2 inset-y-0 bg-[#0AA86E]/20 rounded-2xl blur-sm"
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
          />
          <motion.div
            layoutId="bottom-nav-indicator"
            className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0AA86E]"
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
          />
        </>
      )}
      <motion.div
        animate={{ scale: active ? 1.1 : 1, y: active ? -1 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="relative z-10"
        style={{ color: active ? "#0AA86E" : "#5C7A6D" }}
      >
        <Icon size={22} strokeWidth={active ? 2.6 : 2} />
      </motion.div>
      <motion.span
        animate={{ opacity: active ? 1 : 0.6, scale: active ? 1 : 0.9 }}
        className="text-[9px] font-black uppercase tracking-widest mt-0.5"
        style={{ color: active ? "#0AA86E" : "#5C7A6D" }}
      >
        {label}
      </motion.span>
    </button>
  );
});

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 z-[100] pointer-events-none" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
      <nav className="mx-auto flex items-center justify-around px-2 py-2 liquid-glass rounded-full w-full max-w-md pointer-events-auto shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {ITEMS.map((item) => {
          const active = item.match.some((m) => loc.pathname === m || (m === "/" && loc.pathname === "/"));
          return (
            <NavButton
              key={item.path}
              item={item}
              active={active}
              onClick={() => nav(item.path)}
              label={t(item.label).split(" ")[0]}
            />
          );
        })}
      </nav>
    </div>
  );
}