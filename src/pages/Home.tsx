import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Briefcase, Bot, Camera, FileText, User, LogOut } from "lucide-react";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
import { Card } from "@/components/ui/card";
import { VCareer, VDocument, VGlobal, VShield, VVision } from "@/components/icons/VaxtaGoIcons";
import { useTelegramUser } from "@/components/TelegramProvider";
import { FadeUp, stagger, fadeUp } from "@/components/animations";
import { analytics } from "@/services/Analytics";
import { useEffect } from "react";

const MENU = [
  { icon: <VCareer className="w-6 h-6" />, label: "Вакансии", path: "/jobs" },
  { icon: <Bot className="w-6 h-6" />, label: "AI помощник", path: "/ai" },
  { icon: <VVision className="w-6 h-6" />, label: "Фото переводчик", path: "/photo-translator" },
  { icon: <VDocument className="w-6 h-6" />, label: "Документы", path: "/documents" },
  { icon: <User className="w-6 h-6" />, label: "Профиль", path: "/profile" },
];

export default function Home() {
  const nav = useNavigate();
  const { firstName, logout } = useTelegramUser();

  useEffect(() => {
    analytics.track("home_open");
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-[#080B14] text-white">
      <div className="flex-shrink-0 p-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl vg-gradient flex items-center justify-center">
              <span className="text-white font-bold text-lg">{firstName?.[0]?.toUpperCase() || "V"}</span>
            </div>
            <div>
              <p className="text-sm text-slate-400">Добро пожаловать в</p>
              <h1 className="text-xl font-bold vg-gradient-text">VaxtaGo</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VaxtaGoLogo size={36} />
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:bg-white/5 transition"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        <FadeUp>
          <Card variant="gradient" className="mb-6" onClick={() => { analytics.track("ai_assistant_used"); nav("/ai"); }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">🤖</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Vaxta AI</h3>
                <p className="text-white/70 text-sm">Чем могу помочь?</p>
              </div>
            </div>
          </Card>
        </FadeUp>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 gap-3">
          {MENU.map((action, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card onClick={() => nav(action.path)} className="h-full">
                <div className="w-12 h-12 rounded-2xl vg-gradient flex items-center justify-center text-white mb-3">{action.icon}</div>
                <span className="font-semibold text-sm">{action.label}</span>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}