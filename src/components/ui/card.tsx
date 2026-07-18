import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "gradient" | "glass";
  delay?: number;
}

export function Card({ children, className, onClick, variant = "glass", delay = 0 }: CardProps) {
  const variants = {
    default: "glass-card",
    gradient: "glass-card vg-gradient text-white",
    glass: "glass-card",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: onClick ? 1.02 : 1, y: onClick ? -4 : 0 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      onClick={onClick}
      className={cn(
        "p-5 shadow-lg transition-all duration-300",
        variants[variant],
        className
      )}
    >
      {children}
    </motion.div>
  );
}