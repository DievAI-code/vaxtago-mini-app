"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  delay?: number;
}

export function GlassCard({ children, className, onClick, hover = true, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" } : {}}
      whileTap={onClick ? { scale: 0.96 } : {}}
      onClick={onClick}
      className={cn(
        "liquid-glass p-5 rounded-[2.2rem] transition-all duration-300",
        onClick && "cursor-pointer active:brightness-90",
        className
      )}
    >
      {children}
    </motion.div>
  );
}