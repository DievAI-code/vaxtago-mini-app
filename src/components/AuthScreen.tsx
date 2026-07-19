import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApp } from "@/lib/theme";
import { VaxtaGoLogo } from "./VaxtaGoLogo";
import { useTelegramUser } from "./TelegramProvider";
import { openTelegram, isInTelegram } from "@/utils/telegram-utils";

export function AuthScreen({ onAuth }: { onAuth: (profile: any) => void }) {
  const { t } = useTranslation();
  const { lang } = useApp();
  const { isInTelegram: inTg, authLoading } = useTelegramUser();
  const [loading, setLoading] = useState(false);

  const handleTelegramLogin = async () => {
    setLoading(true);
    if (inTg) {
      // Already in Telegram, auth happens automatically via TelegramProvider
      // Wait for auth to complete
      const checkAuth = setInterval(() => {
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
          clearInterval(checkAuth);
          onAuth({ id: window.Telegram.WebApp.initDataUnsafe.user.id });
        }
      }, 500);
      setTimeout(() => clearInterval(checkAuth), 10000);
    } else {
      // Not in Telegram, open Telegram
      openTelegram();
      setLoading(false);
    }
  };

  if (inTg && authLoading) {
    return (
      <div className="min-h-screen bg-[#080B14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Авторизация через Telegram...</p>
        </div>
      </div>
    );
  }

  if (inTg) {
    // In Telegram but not authed yet - show loading
    return (
      <div className="min-h-screen bg-[#080B14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Авторизация через Telegram...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl vg-gradient flex items-center justify-center mb-6">
              <VaxtaGoLogo size={48} animated />
            </div>
            <h1 className="text-3xl font-black vg-gradient-text">VaxtaGo</h1>
            <p className="text-sm text-slate-400 mt-2">Ваш безопасный путь к работе</p>

            <p className="text-sm text-amber-400 mt-4">
              Откройте VaxtaGo внутри Telegram.
            </p>

            <div className="mt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTelegramLogin}
                disabled={loading}
                className="w-full py-4 rounded-2xl vg-gradient text-white font-semibold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                <Send size={20} />
                {loading ? "Открываем..." : "Открыть в Telegram"}
              </motion.button>
            </div>

            <p className="text-xs text-slate-500 mt-6">
              Авторизация через Telegram. Без SMS и паролей.
            </p>
          </div>
        </motion.div>
      </div>
      <div className="p-4 text-center">
        <p className="text-xs text-slate-500">Founder: Диев Дмитрий Сергеевич</p>
      </div>
    </div>
  );
}