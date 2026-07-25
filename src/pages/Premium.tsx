"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { Crown, Check, Zap, ShieldCheck, Sparkles, Star, BarChart3, Ban } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";

const FEATURES = [
  { icon: Zap, title: "premium.feature_1", desc: "premium.feature_1_d", color: "text-[#0AA86E]" },
  { icon: Sparkles, title: "premium.feature_2", desc: "premium.feature_2_d", color: "text-purple-400" },
  { icon: ShieldCheck, title: "premium.feature_3", desc: "premium.feature_3_d", color: "text-cyan-400" },
  { icon: Star, title: "premium.feature_4", desc: "premium.feature_4_d", color: "text-[#D4AF37]" },
  { icon: BarChart3, title: "premium.feature_5", desc: "premium.feature_5_d", color: "text-blue-400" },
  { icon: Ban, title: "premium.feature_6", desc: "premium.feature_6_d", color: "text-pink-400" },
];

export default function Premium() {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = () => {
    setIsActivating(true);
    setTimeout(() => {
      setIsActivating(false);
      toast.success("Запрос на активацию Premium отправлен!");
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="nav.premium" onMenuClick={() => setIsMenuOpen(true)} showBack />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="px-5 space-y-5 mt-2 flex-1">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden vaqta-glass p-7 border-[#D4AF37]/30 text-center"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[#0AA86E]/10 blur-3xl" />

          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#D4AF37] to-[#F5D17E] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(212,175,55,0.4)] mb-3"
            >
              <Crown className="text-black" size={28} />
            </motion.div>

            <h1 className="text-2xl font-black text-white leading-tight">
              {t("premium.hero_title")}
            </h1>
            <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest mt-1">
              {t("premium.hero_subtitle")}
            </p>

            <div className="inline-flex items-baseline gap-1 mt-4 px-5 py-2 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-3xl font-black text-white">{t("premium.price_value")}</span>
              <span className="text-xs text-[#5C7A6D] font-bold">{t("premium.price_period")}</span>
            </div>
          </div>
        </motion.section>

        {/* Features */}
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2 mb-3">
            {t("premium.features")}
          </h3>
          <div className="space-y-2.5">
            {FEATURES.map((f, idx) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="vaqta-glass p-4 flex items-center gap-3 hover:border-[#D4AF37]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <f.icon className={f.color} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white leading-tight">{t(f.title)}</p>
                  <p className="text-[10px] text-[#5C7A6D] mt-0.5 leading-snug">{t(f.desc)}</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-[#0AA86E]/20 flex items-center justify-center flex-shrink-0">
                  <Check className="text-[#0AA86E]" size={12} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <button
          onClick={handleActivate}
          disabled={isActivating}
          className="w-full h-16 rounded-3xl vaqta-gradient font-black text-white text-base shadow-xl vaqta-glow uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          {isActivating ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              <Crown size={20} />
              <span>{t("premium.buy")}</span>
            </>
          )}
        </button>

        <p className="text-center text-[9px] text-[#5C7A6D] uppercase font-black tracking-widest">
          {t("copyright")}
        </p>
      </main>

      <BottomNav />
    </div>
  );
}