import { motion } from "framer-motion";
import { Briefcase, FileCheck, Globe, Scale, Camera, Crown, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp, stagger, fadeUp } from "@/components/animations";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";

const QUICK = [
  { icon: <Briefcase className="w-6 h-6" />, label: "💼 Найти работу", q: "Найди работу сварщика", color: "from-blue-500/20 to-cyan-400/20", path: "/jobs" },
  { icon: <FileCheck className="w-6 h-6" />, label: "📄 Проверить документ", q: "Проверь мой трудовой договор", color: "from-purple-500/20 to-pink-500/20", path: "/scanner" },
  { icon: <Globe className="w-6 h-6" />, label: "🌍 Перевести текст", q: "Переведи текст на узбекский", color: "from-orange-500/20 to-amber-500/20", path: "/chat" },
  { icon: <Scale className="w-6 h-6" />, label: "⚖ Юридическая помощь", q: "Какие права у мигрантов?", color: "from-red-500/20 to-rose-500/20", path: "/chat" },
  { icon: <Camera className="w-6 h-6" />, label: "📷 Сканировать документ", q: "Распознай документ", color: "from-teal-500/20 to-emerald-500/20", path: "/scanner" },
  { icon: <Crown className="w-6 h-6" />, label: "⭐ Premium", q: "Расскажи о Premium", color: "from-yellow-500/20 to-amber-500/20", path: "/chat" },
];

export default function Index() {
  const nav = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-800 dark:text-white">
      <div className="flex-shrink-0"><Navbar /></div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        {/* Hero */}
        <FadeUp>
          <div className="flex items-center gap-3 mb-2">
            <VaxtaGoLogo size={44} />
            <div>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#2563EB] to-[#14B8A6] bg-clip-text text-transparent">VaxtaGo</h1>
              <p className="text-xs text-[#06B6D4] font-medium">AI Assistant</p>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Чем я могу помочь?</p>
        </FadeUp>

        {/* Quick action cards */}
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK.map((card, i) => (
            <motion.button
              key={i}
              variants={fadeUp}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { if (card.path) nav(card.path); else { nav("/chat"); window.dispatchEvent(new CustomEvent("vaxtago-quick", { detail: card.q })); } }}
              className={`flex items-center gap-4 p-5 rounded-[20px] bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300 text-left`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-[#2563EB] dark:text-[#06B6D4]`}>
                {card.icon}
              </div>
              <span className="font-semibold text-sm flex-1">{card.label}</span>
              <ArrowRight size={18} className="text-slate-400" />
            </motion.button>
          ))}
        </motion.div>

        <div className="mt-8">
          <Footer />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}