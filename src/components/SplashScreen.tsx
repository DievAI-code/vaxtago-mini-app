import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { VaxtaGoLogo } from "./VaxtaGoLogo";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => { setShow(false); setTimeout(onDone, 600); }, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080B14]" animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.6 }}>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 14 }} className="w-24 h-24 rounded-3xl glass-card flex items-center justify-center shadow-2xl">
        <VaxtaGoLogo size={56} animated />
      </motion.div>
      <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="mt-6 text-2xl font-black text-white tracking-tight">VaxtaGo</motion.h1>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.95 }} className="mt-2 text-sm text-[#7C3AED] text-center px-8">AI Assistant</motion.p>
      <motion.div className="mt-4 w-32 h-1 bg-white/10 rounded-full overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
        <motion.div className="h-full vg-gradient rounded-full" initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
      </motion.div>
    </motion.div>
  );
}
