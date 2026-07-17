import { motion } from "framer-motion";
import { ReactNode } from "react";
import { fadeUp } from "./animations";

export function FeatureCard({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      variants={fadeUp}
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.95 }}
      className="group text-left p-6 rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white text-2xl mb-4 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
    </motion.button>
  );
}