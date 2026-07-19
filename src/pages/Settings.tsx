import { motion } from "framer-motion";
import { Moon, Sun, Globe, Bell, Lock, HelpCircle, ChevronRight, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { useApp } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGS, Lang } from "@/i18n";
import { FadeUp, stagger, fadeUp } from "@/components/animations";

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uz", label: "O'zbekcha", flag: "🇺🇿" },
  { code: "tg", label: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "ky", label: "Кыргызча", flag: "🇰🇬" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export default function Settings() {
  const { lang, setLang, theme, toggleTheme } = useApp();
  const { t } = useTranslation();

  const settingsItems = [
    { icon: <Bell className="w-5 h-5" />, label: "Уведомления", action: () => {} },
    { icon: <Lock className="w-5 h-5" />, label: "Приватность", action: () => {} },
    { icon: <HelpCircle className="w-5 h-5" />, label: "Помощь", action: () => {} },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0F172A] text-white">
      <Header title="Настройки" />
      
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <FadeUp>
          <h3 className="text-lg font-bold mb-3 px-1">Язык</h3>
          <div className="grid grid-cols-1 gap-2 mb-6">
            {LANGS.map((l) => (
              <Card key={l.code} variant={lang === l.code ? "gradient" : "default"} className="flex items-center gap-3 py-3 cursor-pointer" onClick={() => setLang(l.code)}>
                <span className="text-2xl">{l.flag}</span>
                <span className="flex-1 font-medium">{l.label}</span>
                {lang === l.code && <Check className="w-5 h-5 text-[#06B6D4]" />}
              </Card>
            ))}
          </div>
        </FadeUp>

        <FadeUp>
          <h3 className="text-lg font-bold mb-3 px-1">Внешний вид</h3>
          <Card variant="default" className="flex items-center gap-3 py-3 cursor-pointer mb-6" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="w-5 h-5 text-[#06B6D4]" /> : <Sun className="w-5 h-5 text-[#06B6D4]" />}
            <span className="flex-1 font-medium">Тема</span>
            <span className="text-sm text-slate-400">{theme === "light" ? "Светлая" : "Темная"}</span>
            <ChevronRight size={18} className="text-slate-400" />
          </Card>
        </FadeUp>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-2">
          {settingsItems.map((item, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card variant="default" className="flex items-center gap-3 py-3 cursor-pointer hover:bg-slate-700/30" onClick={item.action}>
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-[#06B6D4]">
                  {item.icon}
                </div>
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight size={18} className="text-slate-400" />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <FadeUp>
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">VaxtaGo v2.0</p>
            <p className="text-xs text-slate-500">© 2026 Dmitry Diev</p>
          </div>
        </FadeUp>
      </div>

      <BottomNav />
    </div>
  );
}