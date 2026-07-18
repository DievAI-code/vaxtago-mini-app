import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

const variants = {
  primary: "bg-gradient-to-r from-[#2563EB] to-[#14B8A6] text-white shadow-lg shadow-[#2563EB]/20",
  secondary: "bg-slate-800/50 text-slate-200 border border-slate-700/50 hover:bg-slate-700/50",
  ghost: "bg-transparent text-slate-300 hover:bg-slate-800/30",
  danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/20",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({ children, onClick, variant = "primary", size = "md", className, disabled, icon }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-200",
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {icon}
      {children}
    </motion.button>
  );
}