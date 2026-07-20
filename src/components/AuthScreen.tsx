import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { VaxtaGoLogo } from "./VaxtaGoLogo";
import { useTelegramUser } from "./TelegramProvider";
import { useState } from "react";

export function AuthScreen({ mode }: { mode: "telegram-only" | "phone" }) {
  const { t } = useTranslation();
  const { requestPhone, setPhoneAndSave } = useTelegramUser();
  const [phoneInput, setPhoneInput] = useState("");

  if (mode === "phone") {
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
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 14 }}
                className="w-24 h-24 mx-auto rounded-3xl vg-gradient flex items-center justify-center mb-6 shadow-2xl"
              >
                <VaxtaGoLogo size={56} animated />
              </motion.div>
              <h1 className="text-2xl font-bold text-white">Подтвердите номер телефона</h1>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Для завершения регистрации подтвердите номер телефона
              </p>
              <div className="mt-6 space-y-3">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+998 __ ___ __ __"
                  className="w-full px-4 py-3 rounded-2xl glass-card border-0 outline-none text-sm text-white placeholder-slate-400"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => phoneInput && setPhoneAndSave(phoneInput)}
                  className="w-full py-4 rounded-2xl vg-gradient text-white font-semibold text-lg flex items-center justify-center gap-3 hover:shadow-lg transition-all"
                >
                  <Phone size={22} />
                  📱 Поделиться номером телефона
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}