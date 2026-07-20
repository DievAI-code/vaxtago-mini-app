import { motion } from "framer-motion";
import { VaxtaGoLogo } from "./VaxtaGoLogo";
import { useTelegramUser } from "./TelegramProvider";

export function AuthScreen() {
  const { isInTelegram } = useTelegramUser();

  if (isInTelegram) {
    // Inside Telegram: show loading while TelegramProvider resolves auth
    return (
      <div className="min-h-screen bg-[#080B14] flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="w-24 h-24 rounded-3xl vg-gradient flex items-center justify-center mb-6 shadow-2xl"
        >
          <VaxtaGoLogo size={56} animated glow />
        </motion.div>
        <p className="text-slate-300 text-sm">Безопасный вход через Telegram...</p>
        <div className="mt-4 w-8 h-8 rounded-full border-2 border-[#7C3AED]/40 border-t-[#7C3AED] animate-spin" />
      </div>
    );
  }

  // Opened in browser: explain Telegram-only access
  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="w-24 h-24 rounded-3xl vg-gradient flex items-center justify-center mb-6 shadow-2xl"
      >
        <VaxtaGoLogo size={56} animated />
      </motion.div>
      <h1 className="text-2xl font-bold text-white text-center mb-2">VaxtaGo</h1>
      <p className="text-slate-400 text-center text-sm max-w-xs leading-relaxed">
        Откройте VaxtaGo через Telegram для безопасного входа
      </p>
    </div>
  );
}