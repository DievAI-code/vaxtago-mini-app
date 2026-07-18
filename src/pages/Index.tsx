import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VBrain, VCareer, VDocument, VGlobal, VShield, VPremium } from "@/components/icons/VaxtaGoIcons";
import { useTelegramUser } from "@/components/TelegramProvider";
import { useApp } from "@/lib/theme";
import { FadeUp, stagger, fadeUp } from "@/components/animations";

const QUICK_ACTIONS = [
  { icon: <VCareer className="w-6 h-6" />, label: "Работа", path: "/jobs" },
  { icon: <VDocument className="w-6 h-6" />, label: "Документы", path: "/documents" },
  { icon: <VGlobal className="w-6 h-6" />, label: "Перевод", path: "/translate" },
  { icon: <VShield className="w-6 h-6" />, label: "Проверка", path: "/employer" },
];

const RECENT = [
  { type: "job", title: "Сварщик в Москве", time: "2 ч назад" },
  { type: "doc", title: "Патент распознан", time: "1 дн назад" },
  { type: "translate", title: "Договор → RU", time: "3 дн назад" },
];

export default function Index() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { firstName } = useTelegramUser();
  const { lang } = useApp();

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0F172A] text-white">
      <div className="flex-shrink-0 p-4 pt-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <VaxtaGoLogo size={40} />
          <div>
            <h1 className="text-xl font-bold">VaxtaGo</h1>
            <p className="text-xs text-[#06B6D4]">AI Assistant</p>
          </div>
        </motion.div>
        <FadeUp>
          <h2 className="text-2xl font-bold mt-6">
            {firstName ? `Привет, ${firstName}!` : "Привет!"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">Чем могу помочь сегодня?</p>
        </FadeUp>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        <FadeUp>
          <Card variant="gradient" className="mb-6" onClick={() => nav("/ai")}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center">
                <VBrain className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">AI Помощник</h3>
                <p className="text-slate-400 text-sm">Задайте любой вопрос</p>
              </div>
              <Button size="sm" variant="primary">Открыть</Button>
            </div>
          </Card>
        </FadeUp>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 gap-3 mb-6">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card onClick={() => nav(action.path)} className="h-full">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 to-[#14B8A6]/20 flex items-center justify-center text-[#06B6D4] mb-3">
                  {action.icon}
                </div>
                <span className="font-semibold">{action.label}</span>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <FadeUp>
          <h3 className="text-lg font-bold mb-3 px-1">Последние операции</h3>
          <div className="space-y-2">
            {RECENT.map((item, i) => (
              <Card key={i} variant="default" className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-[#06B6D4]">
                  {item.type === "job" && <VCareer className="w-5 h-5" />}
                  {item.type === "doc" && <VDocument className="w-5 h-5" />}
                  {item.type === "translate" && <VGlobal className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.time}</p>
                </div>
              </Card>
            ))}
          </div>
        </FadeUp>

        <FadeUp>
          <Card variant="gradient" className="mt-6 flex items-center gap-3" onClick={() => nav("/premium")}>
            <VPremium className="w-8 h-8 text-[#14B8A6]" />
            <div className="flex-1">
              <p className="font-bold">VaxtaGo Premium</p>
              <p className="text-xs text-slate-400">Безлимитный AI и приоритет</p>
            </div>
            <Button size="sm" variant="secondary">Подключить</Button>
          </Card>
        </FadeUp>
      </div>
    </div>
  );
}