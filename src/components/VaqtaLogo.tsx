import { motion } from "framer-motion";

export function VaqtaLogo({ size = 40, animated = false }) {
  return (
    <motion.div 
      initial={animated ? { scale: 0.8, opacity: 0 } : {}}
      animate={{ scale: 1, opacity: 1 }}
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 bg-[#00A86B] blur-xl opacity-20 animate-pulse" />
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <path d="M20 20L50 80L80 20" stroke="#00A86B" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40 45L50 65L60 45" stroke="#D4AF37" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  );
}