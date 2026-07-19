import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { VaxtaGoLogo } from "./VaxtaGoLogo";
import { useTelegramUser } from "./TelegramProvider";
import { openTelegram } from "@/utils/telegram-utils";

export function AuthScreen({ mode }: { mode: "telegram-only" | "phone" }) {
  const { t } = useTranslation();
  const { requestPhone } = useTelegramUser();
  const [loading, setLoading] = useState(false);

  const handleOpenTelegram = () => {
    setLoading(true);
    openTelegram();
    setTimeout(() => setLoading(false), 1500);
  };

  if (mode === "phone") {
    return (
      <div className="min-h-screen bg-[#080B14] flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
            <div className="glass-card p-8 text-center">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 14 }} className="w-24 h-24 mx-auto rounded-3xl vg-gradient flex items-center justify-center mb-6 shadow-2xl">
                <VaxtaGoLogo size={56} animated />
              </motion.div>
              <h1 className="text-2xl font-bold text-white">Подтвердите номер телефона</h1>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Номер нужен для безопасности аккаунта и связи с работодателями.
              </p>
              <div className="mt-8">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={requestPhone} className="w-full py-4 rounded-2xl vg-gradient text-white font-semibold text-lg flex items-center justify-center gap-3 hover:shadow-lg transition-all">
                  <Phone size={22} />
                  📱 Поделиться номером
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="glass-card p-8 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 14 }} className="w-24 h-24 mx-auto rounded-3xl vg-gradient flex items-center justify-center mb-6 shadow-2xl">
              <VaxtaGoLogo size={56} animated />
            </motion.div>
            <h1 className="text-3xl font-black vg-gradient-text">VaxtaGo</h1>
            <p className="text-sm text-slate-400 mt-2">AI помощник для мигрантов</p>
            <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-slate-300 text-sm leading-relaxed">
                Откройте VaxtaGo через Telegram для безопасной авторизации.
              </p>
            </div>
            <div className="mt-8">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleOpenTelegram} disabled={loading} className="w-full py-4 rounded-2xl vg-gradient text-white font-semibold text-lg flex items-center justify-center gap-3 disabled:opacity-50 transition-all">
                <MessageCircle size={22} />
                {loading ? "Открываем..." : "Открыть Telegram"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}