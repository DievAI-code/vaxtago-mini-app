import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { useTelegramUser } from "./TelegramProvider";
import { useTranslation } from "react-i18next";

export function WelcomeScreen() {
  const { firstName, isInTelegram } = useTelegramUser();
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center text-center px-6 py-12"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-xl mb-6"
      >
        <Bot className="w-10 h-10 text-white" />
      </motion.div>

      <motion.h1
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"
      >
        {t("welcome_title")}
      </motion.h1>

      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-200"
      >
        {isInTelegram && firstName ? t("welcome_greeting") + ", " + firstName + "!" : t("welcome_greeting")}
      </motion.p>

      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-1 text-sm text-slate-500 dark:text-slate-400"
      >
        {t("welcome_founder")}
      </motion.p>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 max-w-sm p-5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 shadow-sm"
      >
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          {t("welcome_subtitle")}
        </p>
      </motion.div>
    </motion.div>
  );
}
