import { motion } from "framer-motion";
import { VBrain, VDocument, VCareer, VGlobal, VShield, VPremium } from "@/components/icons/VaxtaGoIcons";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp, stagger, fadeUp } from "@/components/animations";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const QUICK = [
  { label: "🔎 Найти работу", q: "Найди работу сварщика" },
  { label: "📄 Проверить документ", q: "Проверь мой трудовой договор" },
  { label: "🌐 Перевести текст", q: "Переведи текст на узбекский" },
  { label: "⚖ Помощь по миграции", q: "Как встать на миграционный учет?" },
];

export default function Index() {
  const nav = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-[100dvh] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="flex-shrink-0">
        <Navbar />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <FadeUp>
          <p className="text-sm text-white/60">Добро пожаловать в</p>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">VaxtaGo 2.0</h1>
        </FadeUp>

        {/* AI Card */}
        <motion.button
          variants={fadeUp}
          onClick={() => nav("/chat")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-4 p-5 rounded-3xl bg-gradient-to-r from-blue-600/30 to-cyan-500/20 border border-blue-400/30 backdrop-blur-xl shadow-lg"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <VBrain className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-lg">🤖 VaxtaGo AI</p>
            <p className="text-sm text-white/70">Спросите что угодно</p>
          </div>
        </motion.button>

        {/* Feature cards */}
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 gap-4">
          {[
            { icon: <VDocument className="w-6 h-6" />, title: "Smart Documents", color: "from-purple-500/20 to-pink-500/20" },
            { icon: <VCareer className="w-6 h-6" />, title: "Jobs", color: "from-green-500/20 to-emerald-500/20" },
            { icon: <VGlobal className="w-6 h-6" />, title: "Translator", color: "from-orange-500/20 to-amber-500/20" },
            { icon: <VShield className="w-6 h-6" />, title: "Legal Help", color: "from-red-500/20 to-rose-500/20" },
          ].map((card, i) => (
            <motion.div key={i} variants={fadeUp} whileHover={{ y: -4 }} className={`p-4 rounded-2xl bg-gradient-to-br ${card.color} border border-white/10 backdrop-blur-xl`}>
              <div className="text-blue-300 mb-2">{card.icon}</div>
              <p className="font-semibold text-sm">{card.title}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button key={q.label} onClick={() => { nav("/chat"); window.dispatchEvent(new CustomEvent("vaxtago-quick", { detail: q.q })); }} className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs hover:bg-white/20 transition">
              {q.label}
            </button>
          ))}
        </div>

        <Footer />
      </div>

      <BottomNav />
    </div>
  );
}