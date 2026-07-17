import { motion } from "framer-motion";
import { Bot, ScanLine, Briefcase, Building2, Languages, Scale, Crown, Search, FileText, ShieldCheck, FileCheck, BookOpen, MapPin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FeatureCard } from "@/components/FeatureCard";
import { ChatWidget } from "@/components/ChatWidget";
import { FadeUp, stagger, fadeUp } from "@/components/animations";
import { useStrings } from "@/lib/theme";
import { useNavigate } from "react-router-dom";

const QUICK = [
  { label: "Найти работу", q: "Найди работу сварщика" },
  { label: "Перевести паспорт", q: "Переведи паспорт на узбекский" },
  { label: "Проверить работодателя", q: "Проверь работодателя по ИНН" },
  { label: "Условия патента", q: "Какие условия патента для мигранта?" },
  { label: "Миграционный учет", q: "Как встать на миграционный учет?" },
  { label: "Проверить договор", q: "Проверь трудовой договор" },
];

const STATS = [
  { n: "1000+", l: "проверенных вакансий" },
  { n: "50+", l: "городов России" },
  { n: "24/7", l: "AI поддержка" },
  { n: "4", l: "языка" },
];

export default function Index() {
  const s = useStrings();
  const nav = useNavigate();

  const cards = [
    { icon: <Bot />, title: s.ai, desc: s.ai_d, action: () => document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" }) },
    { icon: <ScanLine />, title: s.scan, desc: s.scan_d, action: () => nav("/scanner") },
    { icon: <Briefcase />, title: s.jobs, desc: s.jobs_d, action: () => nav("/jobs") },
    { icon: <Building2 />, title: s.employer, desc: s.employer_d, action: () => {} },
    { icon: <Languages />, title: s.translate, desc: s.translate_d, action: () => {} },
    { icon: <Scale />, title: s.lawyer, desc: s.lawyer_d, action: () => {} },
    { icon: <Crown />, title: s.premium, desc: s.premium_d, action: () => {} },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-400/5 to-transparent" />
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative max-w-3xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white text-4xl font-black shadow-2xl">
            V
          </motion.div>
          <motion.h1 variants={fadeUp} className="mt-6 text-5xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            VaxtaGo
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-3 text-xl font-medium text-slate-600 dark:text-slate-300">
            {s.tagline}
          </motion.p>
          <motion.p variants={fadeUp} className="mt-4 text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {s.desc}
          </motion.p>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <FeatureCard key={c.title} icon={c.icon} title={c.title} desc={c.desc} onClick={c.action} />
          ))}
        </motion.div>
      </section>

      {/* Quick Actions */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <FadeUp>
          <h2 className="text-2xl font-bold mb-4">{s.popular}</h2>
        </FadeUp>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q.label}
              onClick={() => {
                document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" });
                // dispatch to chat via custom event
                window.dispatchEvent(new CustomEvent("vaxtago-quick", { detail: q.q }));
              }}
              className="px-4 py-2 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-blue-50 dark:hover:bg-slate-700 transition"
            >
              {q.label}
            </button>
          ))}
        </div>
      </section>

      {/* Chat */}
      <section id="chat" className="max-w-3xl mx-auto px-4 py-8">
        <FadeUp>
          <h2 className="text-2xl font-bold mb-4">💬 AI Помощник</h2>
        </FadeUp>
        <ChatWidgetBridge />
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((st) => (
            <motion.div key={st.l} variants={fadeUp} className="text-center p-6 rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{st.n}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{st.l}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

// Bridge to allow quick actions to send to chat
import { ChatWidget } from "@/components/ChatWidget";
function ChatWidgetBridge() {
  return <ChatWidget />;
}