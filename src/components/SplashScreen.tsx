import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(false);
      setTimeout(onDone, 600);
    }, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400"
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl"
      >
        <span className="text-4xl font-black text-white">V</span>
      </motion.div>
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-2xl font-bold text-white tracking-tight"
      >
        VaxtaGo
      </motion.h1>
      <motion.div
        className="mt-4 w-32 h-1 bg-white/30 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}