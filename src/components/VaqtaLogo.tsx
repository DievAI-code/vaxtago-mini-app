"use client";

import React from "react";
import { motion } from "framer-motion";

interface VaqtaLogoProps {
  size?: number;
  animated?: boolean;
  glow?: boolean;
}

/**
 * Оптимизированный компонент логотипа.
 * Используется React.memo для исключения повторных рендеров.
 */
export const VaqtaLogo = React.memo(({ size = 40, animated = false, glow = true }: VaqtaLogoProps) => {
  return (
    <motion.div 
      initial={animated ? { scale: 0.8, opacity: 0 } : { scale: 1, opacity: 1 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {glow && (
        <div className="absolute inset-0 bg-[#00A86B] blur-xl opacity-30 animate-pulse pointer-events-none" />
      )}
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vg-grad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00A86B" />
            <stop offset="1" stopColor="#00D4A8" />
          </linearGradient>
        </defs>
        <path 
          d="M20 20L50 85L80 20" 
          stroke="url(#vg-grad)" 
          strokeWidth="14" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path 
          d="M42 48L50 68L58 48" 
          stroke="#D4AF37" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <circle cx="50" cy="85" r="3" fill="#D4AF37" />
      </svg>
    </motion.div>
  );
});

VaqtaLogo.displayName = "VaqtaLogo";

export default VaqtaLogo;