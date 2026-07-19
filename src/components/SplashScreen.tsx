import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { VaxtaGoLogo } from "./VaxtaGoLogo";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => { setShow(false); setTimeout(onDone, 600); }, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080B14]" animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.6 }}>
      <div className="relative flex items-center justify-center mb-8">
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute"
        >
          <VaxtaGoLogo size={72} animated />
        </motion.div>
        <motion.div
          initial={{ x: -120, opacity: 0 }}
          animate={{ x: 0, opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          className="absolute w-16 h-1 vg-gradient rounded-full blur-md"
        />
      </div>
      <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="text-2xl font-black text-white tracking-tight">Добро пожаловать в VaxtaGo</motion.h1>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="mt-2 text-sm text-[#7C3AED] text-center px-8">Работа. Документы. Безопасность.</motion.p>
      <motion.div className="mt-4 w-32 h-1 bg-white/10 rounded-full overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
        <motion.div className="h-full vg-gradient rounded-full" initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
      </motion.div>
    </motion.div>
  );
}