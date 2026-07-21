import { motion } from "framer-motion";

export function VaqtaAiLogo({ size = 32, animated = true }: { size?: number; animated?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <motion.div 
        className="relative"
        initial={animated ? { rotate: -10, opacity: 0 } : {}}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="#00A86B" />
          <path d="M10 12L20 28L30 12" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="20" cy="20" r="4" fill="#D4AF37" className="animate-pulse" />
        </svg>
        <div className="absolute inset-0 bg-[#00A86B] blur-xl opacity-20 -z-10" />
      </motion.div>
      <span className="font-black tracking-tighter text-xl italic">
        VAQTA <span className="text-[#00A86B]">AI</span>
      </span>
    </div>
  );
}