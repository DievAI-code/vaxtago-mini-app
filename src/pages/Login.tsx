import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
import { useTelegramUser } from "@/components/TelegramProvider";
import { BOT_USERNAME } from "@/utils/telegram-utils";
import { analytics } from "@/services/Analytics";

export default function Login() {
  const { loginWithToken, isAuthed } = useTelegramUser();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handled = useRef(false);

  // If bot redirected with ?token=xxx, consume it
  useEffect(() => {
    const token = searchParams.get("token");
    if (token && !handled.current) {
      handled.current = true;
      setLoading(true);
      loginWithToken(token)
        .then((ok) => {
          if (ok) nav("/home", { replace: true });
          else { setError("Не удалось войти. Попробуйте ещё раз."); setLoading(false); }
        })
        .catch(() => { setError("Не удалось войти. Попробуйте ещё раз."); setLoading(false); });
    }
  }, [searchParams, loginWithToken, nav]);

  // Already authed
  useEffect(() => {
    if (isAuthed) nav("/home", { replace: true });
  }, [isAuthed, nav]);

  const openBot = () => {
    analytics.track("login_start");
    window.open(`https://t.me/${BOT_USERNAME}?start=web`, "_blank");
  };

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
              AI помощник для работы, документов и жизни в России
            </p>

            <div className="mt-8">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openBot}
                disabled={loading}
                className="w-full py-4 rounded-2xl vg-gradient text-white font-semibold text-lg flex items-center justify-center gap-3 hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? "Авторизация..." : "Войти через Telegram"}
              </motion.button>
              <p className="text-xs text-slate-500 mt-4">
                Нажмите кнопку, откройте бота и нажмите /start.
                Бот вернёт вас обратно с токеном входа.
              </p>
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