import { motion } from "framer-motion";
import { ReactNode } from "react";

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export function FadeUp({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className={className}>
      {children}
    </motion.div>
  );
}

export function TypingDots() {
  return (
    <div className="flex gap-1 items-center" aria-label="AI is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-blue-500"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}