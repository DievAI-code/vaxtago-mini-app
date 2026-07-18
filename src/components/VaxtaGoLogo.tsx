import { SVGProps } from "react";
import { motion } from "framer-motion";

export function VaxtaGoLogo({ size = 32, className, animated = false }: { size?: number; className?: string; animated?: boolean }) {
  const gradId = "vg-grad-" + size;
  const paths = (
    <>
      <defs>
        <linearGradient id={gradId} x1="4" y1="40" x2="44" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="0.5" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      {/* V shape */}
      <path
        d="M8 36 L20 12 L24 12 L24 20 L28 20 L28 12 L40 36 L34 36 L24 18 L14 36 Z"
        fill={`url(#${gradId})`}
      />
      {/* Forward arrow accent */}
      <path
        d="M20 16 L26 10 L32 16"
        stroke={`url(#${gradId})`}
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
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
      >
        <motion.path
          d="M8 36 L20 12 L24 12 L24 20 L28 20 L28 12 L40 36 L34 36 L24 18 L14 36 Z"
          fill={`url(#${gradId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        />
        <motion.path
          d="M20 16 L26 10 L32 16"
          stroke={`url(#${gradId})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        />
      </motion.svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-label="VaxtaGo">
      {paths}
    </svg>
  );
}

export function VaxtaGoMark({ size = 32, className }: { size?: number; className?: string }) {
  const gradId = "vg-mark-" + size;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-label="VaxtaGo">
      <defs>
        <linearGradient id={gradId} x1="4" y1="40" x2="44" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="0.5" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${gradId})`} />
      <path d="M12 34 L21 15 L24 15 L24 21 L27 21 L27 15 L36 34 L31 34 L24 20 L17 34 Z" fill="white" />
    </svg>
  );
}