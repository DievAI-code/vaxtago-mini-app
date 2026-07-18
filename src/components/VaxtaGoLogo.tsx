import { SVGProps } from "react";
import { motion } from "framer-motion";

export function VaxtaGoLogo({ size = 32, className, animated = false }: { size?: number; className?: string; animated?: boolean }) {
  const paths = (
    <>
      <defs>
        <linearGradient id="vg-grad" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="0.5" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      {/* Road lines forming V */}
      <path
        d="M8 38 L20 14 L24 14 L12 38 Z"
        fill="url(#vg-grad)"
        stroke="url(#vg-grad)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M40 38 L28 14 L24 14 L36 38 Z"
        fill="url(#vg-grad)"
        stroke="url(#vg-grad)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Center divider line */}
      <path
        d="M24 14 L24 38"
        stroke="url(#vg-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Arrow at top */}
      <path
        d="M18 18 L24 10 L30 18"
        stroke="url(#vg-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  );

  if (animated) {
    return (
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className={className}
        aria-label="VaxtaGo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.path
          d="M8 38 L20 14 L24 14 L12 38 Z"
          fill="url(#vg-grad)"
          stroke="url(#vg-grad)"
          strokeWidth="1"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        <motion.path
          d="M40 38 L28 14 L24 14 L36 38 Z"
          fill="url(#vg-grad)"
          stroke="url(#vg-grad)"
          strokeWidth="1"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
        />
        <motion.path
          d="M24 14 L24 38"
          stroke="url(#vg-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeInOut" }}
        />
        <motion.path
          d="M18 18 L24 10 L30 18"
          stroke="url(#vg-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease: "easeInOut" }}
        />
      </motion.svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-label="VaxtaGo"
    >
      {paths}
    </svg>
  );
}

export function VaxtaGoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="VaxtaGo"
    >
      <defs>
        <linearGradient id="vg-mark-grad" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="0.5" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#vg-mark-grad)" />
      <path d="M14 34 L22 16 L26 16 L18 34 Z" fill="white" />
      <path d="M34 34 L26 16 L22 16 L30 34 Z" fill="white" />
      <path d="M24 16 L24 34" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 20 L24 13 L29 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}