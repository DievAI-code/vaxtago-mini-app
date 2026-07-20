import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
import { useTelegramUser } from "@/components/TelegramProvider";
import { BOT_USERNAME } from "@/utils/telegram-utils";
import { analytics } from "@/services/Analytics";

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth: (user: any) => void;
    };
  }
}

export default function Login() {
  const { loginWithTelegram } = useTelegramUser();
  const widgetContainer = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    analytics.track("login_start");

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-lang", "ru");
    script.setAttribute("data-onauth", "TelegramLoginWidget.dataOnauth(user)");

    window.TelegramLoginWidget = {
      dataOnauth: async (user: any) => {
        setLoading(true);
        setError(null);
        try {
          await loginWithTelegram(user);
        } catch (e) {
          setError("Не удалось войти через Telegram. Попробуйте позже.");
          analytics.track("login_error");
          setLoading(false);
        }
      },
    };

    if (widgetContainer.current) {
      widgetContainer.current.appendChild(script);
    }

    return () => {
      if (widgetContainer.current && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [loginWithTelegram]);

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
            <h1 className="text-3xl font-black vg-gradient-text">VaxtaGo</h1>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Добро пожаловать в VaxtaGo
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Поиск работы, AI-помощник и безопасное трудоустройство
            </p>

            <div className="mt-8">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div ref={widgetContainer} className="flex justify-center min-h-[44px]" />
              {loading && (
                <p className="text-slate-400 text-sm mt-4">Авторизация...</p>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-6">
              Нажимая кнопку, вы соглашаетесь с условиями использования
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}