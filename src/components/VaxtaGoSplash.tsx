import { motion } from "framer-motion";

export function VaxtaGoSplash() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 16 }}
        className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl"
      >
        <span className="text-4xl font-black text-white">V</span>
      </motion.div>
      <motion.h1
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-5 text-2xl font-bold text-white tracking-tight"
      >
        VaxtaGo
      </motion.h1>
      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-2 text-sm text-white/80 text-center px-8"
      >
        AI помощник для работы и документов
      </motion.p>
      <div className="mt-5 w-8 h-8 rounded-full border-2 border-white/40 border-t-white animate-spin" />
    </motion.div>
  );
}