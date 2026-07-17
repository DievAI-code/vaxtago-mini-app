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
  { label: "Найти работу", q: "Найди работу сварщика" },
  { label: "Перевести паспорт", q: "Переведи паспорт на узбекский" },
  { label: "Проверить работодателя", q: "Проверь работодателя по ИНН" },
  { label: "Условия патента", q: "Какие условия патента для мигранта?" },
  { label: "Миграционный учет", q: "Как встать на миграционный учет?" },
  { label: "Проверить договор", q: "Проверь трудовой договор" },
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

      <div className="max-w-2xl mx-auto">
        <WelcomeScreen />
      </div>

      {/* Quick actions - visible immediately */}
      <section className="max-w-2xl mx-auto px-4 -mt-4">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" })}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg hover:scale-105 transition-all"
          >
            <Bot size={24} />
            <span className="text-xs font-semibold text-center">🤖 AI Помощник</span>
          </button>
          <button
            onClick={() => document.getElementById("premium")?.scrollIntoView({ behavior: "smooth" })}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:scale-105 transition-all"
          >
            <Crown size={24} className="text-amber-500" />
            <span className="text-xs font-semibold text-center text-slate-700 dark:text-slate-200">⭐ Premium</span>
          </button>
          <button
            onClick={() => nav("/profile")}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:scale-105 transition-all"
          >
            <User size={24} className="text-blue-600" />
            <span className="text-xs font-semibold text-center text-slate-700 dark:text-slate-200">👤 Профиль</span>
          </button>
        </div>
      </section>

      <section className="relative px-4 pt-10 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-cyan-400/5 to-transparent" />
        <div className="absolute inset-0 bg-grid-slate-100/50 dark:bg-grid-slate-800/50 bg-[size:20px_20px]" />
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="relative max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-current" />
              {t("tagline")}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                VaxtaGo
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-4">
              {t("desc")}
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-2xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              <span className="relative z-10 flex items-center gap-2">
                {t("start_telegram")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            <button className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              {t("download_app")}
            </button>
          </motion.div>

          <motion.div variants={fadeUp} className="relative max-w-4xl mx-auto mb-20">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-cyan-400/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">VaxtaGo Bot</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-3 ml-auto max-w-xs">
                      <p className="text-sm">{QUICK[0].q}</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-3 mr-auto max-w-xs">
                      <p className="text-sm">Вот 3 проверенные вакансии с зарплатой 60-80к ₽</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-3 ml-auto max-w-xs">
                      <p className="text-sm">📄 Отправь фото паспорта для перевода</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

      <section className="max-w-6xl mx-auto px-4 py-20">
        <FadeUp>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t("how_it_works")}</h2>
        </FadeUp>
        
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-3 gap-8">
          <motion.div variants={fadeUp} className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">1</div>
            <h3 className="text-xl font-semibold mb-2">{t("step1")}</h3>
            <p className="text-slate-600 dark:text-slate-400">{t("step1_d")}</p>
          </motion.div>
          <motion.div variants={fadeUp} className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">2</div>
            <h3 className="text-xl font-semibold mb-2">{t("step2")}</h3>
            <p className="text-slate-600 dark:text-slate-400">{t("step2_d")}</p>
          </motion.div>
          <motion.div variants={fadeUp} className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">3</div>
            <h3 className="text-xl font-semibold mb-2">{t("step3")}</h3>
            <p className="text-slate-600 dark:text-slate-400">{t("step3_d")}</p>
          </motion.div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-20">
        <FadeUp>
          <h2 className="text-3xl font-bold mb-8">{t("popular")}</h2>
        </FadeUp>
        <div className="flex flex-wrap gap-3">
          {QUICK.map((q) => (
            <button
              key={q.label}
              onClick={() => {
                document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" });
                window.dispatchEvent(new CustomEvent("vaxtago-quick", { detail: q.q }));
              }}
              className="px-5 py-3 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:scale-105"
            >
              {q.label}
            </button>
          ))}
        </div>
      </section>

      <section id="chat" className="max-w-3xl mx-auto px-4 py-20">
        <FadeUp>
          <h2 className="text-3xl font-bold mb-6">{t("chat_title")}</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">{t("chat_desc")}</p>
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

      <section className="max-w-6xl mx-auto px-4 py-20">
        <FadeUp>
          <h2 className="text-3xl font-bold text-center mb-12">{t("trusted")}</h2>
        </FadeUp>
        
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-4 gap-6">
          <motion.div variants={fadeUp} className="text-center p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50">
            <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t("stats1")}</div>
          </motion.div>
          <motion.div variants={fadeUp} className="text-center p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50">
            <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t("stats2")}</div>
          </motion.div>
          <motion.div variants={fadeUp} className="text-center p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50">
            <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t("stats3")}</div>
          </motion.div>
          <motion.div variants={fadeUp} className="text-center p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50">
            <div className="text-3xl font-bold text-blue-600 mb-2">4</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t("stats4")}</div>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}