import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { VaxtaGoLogo } from "./VaxtaGoLogo";
import { Check } from "lucide-react";

const STEPS = [
  "Проверяем подключение...",
  "Инициализация AI...",
  "Проверяем авторизацию...",
  "Загружаем вакансии...",
  "Все готово.",
];

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers: number[] = [];
    STEPS.forEach((_, i) => {
      timers.push(window.setTimeout(() => setStep(i + 1), 600 + i * 420));
    });
    timers.push(window.setTimeout(() => {
      setStep(STEPS.length + 1); // trigger shrink
      window.setTimeout(onDone, 700);
    }, 600 + STEPS.length * 420 + 400));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const words = ["Работа", "AI", "Безопасность"];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080B14] overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: step > STEPS.length ? 0 : 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Abstract map line UZ -> RU */}
      <motion.svg
        width="200" height="120" viewBox="0 0 200 120"
        className="absolute top-24 opacity-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: step >= 2 ? 0.5 : 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.path
          d="M40 30 Q100 10 160 90"
          stroke="url(#sg)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: step >= 2 ? 1 : 0 }}
          transition={{ duration: 1 }}
        />
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="30" r="4" fill="#22C55E" />
        <circle cx="160" cy="90" r="4" fill="#2563EB" />
        <text x="30" y="20" fill="#94A3B8" fontSize="10">UZ</text>
        <text x="150" y="110" fill="#94A3B8" fontSize="10">RU</text>
      </motion.svg>

      {/* Logo draws with glowing line */}
      <motion.div
        animate={{ scale: step > STEPS.length ? 0.6 : 1, y: step > STEPS.length ? -20 : 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <VaxtaGoLogo size={80} animated glow />
      </motion.div>

      {/* Welcome text + words */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 10 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-black text-white tracking-tight text-center"
      >
        Добро пожаловать в VaxtaGo
      </motion.h1>

      <div className="flex gap-3 mt-3 h-6">
        {words.map((w, i) => (
          <motion.span
            key={w}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 8 }}
            transition={{ delay: 0.2 + i * 0.25, duration: 0.4 }}
            className="text-sm text-[#7C3AED] font-medium"
          >
            {w}
          </motion.span>
        ))}
      </div>

      {/* Loading steps */}
      <div className="mt-10 space-y-2 w-64">
        {STEPS.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: step > i ? 1 : 0, x: step > i ? 0 : -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 text-sm"
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center ${step > i ? "bg-[#22C55E]" : "bg-white/10"}`}>
              {step > i && <Check size={12} className="text-white" />}
            </span>
            <span className={step > i ? "text-slate-300" : "text-slate-500"}>{s}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}