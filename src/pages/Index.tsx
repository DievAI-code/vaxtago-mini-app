import { motion } from "framer-motion";
import { Bot, ScanLine, Briefcase, Building2, Languages, Scale, Crown, Search, FileText, ShieldCheck, FileCheck, BookOpen, MapPin, CheckCircle, Star, ArrowRight, User } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FeatureCard } from "@/components/FeatureCard";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { FadeUp, stagger, fadeUp } from "@/components/animations";
import { useNavigate } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";

const ChatWidget = lazy(() => import("@/components/ChatWidget").then(m => ({ default: m.ChatWidget })));

const QUICK = [
  { label: "🔎 Найти работу", q: "Найди работу сварщика" },
  { label: "📄 Проверить документ", q: "Проверь мой трудовой договор" },
  { label: "🌐 Перевести текст", q: "Переведи текст на узбекский" },
  { label: "⚖ Помощь по миграции", q: "Как встать на миграционный учет?" },
];

export default function Index() {
  const nav = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "VaxtaGo",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, Telegram",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "author": { "@type": "Person", "name": "Dmitry Diev" },
      "description": "AI-помощник для трудовых мигрантов: поиск работы, проверка работодателей, перевод документов.",
    });
    document.head.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Navbar />

      {/* Clean AI Hero - no founder block */}
      <section className="relative px-4 pt-16 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-cyan-400/5 to-transparent" />
        <motion.div variants={stagger} initial="hidden" animate="show" className="relative max-w-3xl mx-auto text-center">
          <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-xl mb-6">
            <Bot className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">VaxtaGo AI</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-xl md:text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-8">
            {t("chat_desc")}
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 justify-center">
            {QUICK.map((q) => (
              <button
                key={q.label}
                onClick={() => {
                  document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" });
                  window.dispatchEvent(new CustomEvent("vaxtago-quick", { detail: q.q }));
                }}
                className="px-5 py-3 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-300 transition-all duration-200 hover:scale-105"
              >
                {q.label}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-20">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Search className="w-6 h-6" />, title: t("features_title"), desc: t("features_d1") },
            { icon: <ShieldCheck className="w-6 h-6" />, title: t("features_title2"), desc: t("features_d2") },
            { icon: <FileText className="w-6 h-6" />, title: t("features_title3"), desc: t("features_d3") },
            { icon: <Bot className="w-6 h-6" />, title: t("features_title4"), desc: t("features_d4") },
            { icon: <MapPin className="w-6 h-6" />, title: t("features_title5"), desc: t("features_d5") },
            { icon: <Crown className="w-6 h-6" />, title: t("features_title6"), desc: t("features_d6") },
            { icon: <BookOpen className="w-6 h-6" />, title: t("features_title7"), desc: t("features_d7") },
            { icon: <FileCheck className="w-6 h-6" />, title: t("features_title8"), desc: t("features_d8") },
          ].map((card, index) => (
            <FeatureCard key={index} icon={card.icon} title={card.title} desc={card.desc} />
          ))}
        </motion.div>
      </section>

      <section id="chat" className="max-w-3xl mx-auto px-4 py-20">
        <FadeUp>
          <h2 className="text-3xl font-bold mb-6">{t("chat_title")}</h2>
        </FadeUp>
        <Suspense fallback={<div className="h-[500px] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /></div>}>
          <ChatWidget />
        </Suspense>
      </section>

      <section id="premium" className="max-w-6xl mx-auto px-4 py-20">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="bg-gradient-to-r from-blue-600/10 to-cyan-400/10 rounded-3xl p-8 md:p-12 border border-blue-200 dark:border-blue-800">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("premium_title")}</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">{t("premium_unlimited")}</p>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">{t("premium_price")}</p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /><span>{t("pf1")}</span></div>
              <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /><span>{t("pf2")}</span></div>
              <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /><span>{t("pf3")}</span></div>
              <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /><span>{t("pf4")}</span></div>
              <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /><span>{t("pf5")}</span></div>
            </div>
            <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-2xl hover:scale-105 transition-all duration-300 shadow-lg">
              {t("premium_try")}
            </button>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}