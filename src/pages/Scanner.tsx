"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Loader2, Sparkles, Check, ChevronRight, Download, Globe } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { imageTranslationService } from "@/services/imageTranslationService";
import { subscriptionService } from "@/services/subscriptionService";
import { useLanguage } from "@/context/LanguageProvider";
import { Lang } from "@/i18n";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const TARGET_LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uz", label: "O'zbekcha", flag: "🇺🇿" },
  { code: "tg", label: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "kk", label: "Қазақша", flag: "🇰🇿" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export default function Scanner() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [targetLang, setTargetLang] = useState<Lang>(language);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleUpload = async (file: File) => {
    const canUse = await subscriptionService.canUseFeature("vision");
    if (!canUse) {
      toast.error(t("premium.feature_locked"));
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const data = await imageTranslationService.translateImage(base64, targetLang);
        setResult(data);
        toast.success(t("scanner.result_ready"));
      } catch (err) {
        toast.error(t("scanner.error_ai"));
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="nav.scanner" showBack />
      
      <main className="p-6 space-y-6">
        {/* Выбор языка перевода */}
        <div className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#5C7A6D]">
            <Globe size={16} className="text-[#00A86B]" />
            <span>{t("auth.select_lang")}</span>
          </div>

          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TARGET_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setTargetLang(l.code)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  targetLang === l.code ? "bg-[#00A86B] text-white shadow-lg" : "bg-white/5 text-slate-400"
                }`}
              >
                <span>{l.flag}</span>
              </button>
            ))}
          </div>
        </div>

        {!result ? (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="w-24 h-24 rounded-full vaqta-gradient flex items-center justify-center vaqta-glow shadow-2xl">
              <Camera size={40} />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black">{t("scanner.title")}</h2>
              <p className="text-xs text-[#5C7A6D] font-medium">{t("scanner.desc")}</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              id="cam-input" 
              accept="image/*" 
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <label 
              htmlFor="cam-input"
              className="w-full h-16 bg-[#00A86B] rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest cursor-pointer shadow-lg active:scale-95 transition-transform text-xs"
            >
              {t("scanner.take_photo")} <ChevronRight size={20} />
            </label>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="vaqta-glass p-6 border-[#00A86B]/30">
                <h3 className="text-[10px] font-black uppercase text-[#00A86B] mb-2">{t("scanner.original_text")}</h3>
                <p className="text-sm text-slate-300 italic">{result.ocr_text || t("scanner.error_ocr")}</p>
             </div>
             <div className="vaqta-glass p-6 border-[#D4AF37]/30">
                <h3 className="text-[10px] font-black uppercase text-[#D4AF37] mb-2">{t("scanner.translation")} ({targetLang.toUpperCase()})</h3>
                <p className="text-lg font-bold text-white">{result.translation}</p>
             </div>
             <button onClick={() => setResult(null)} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-xs tracking-wider">
               {t("scanner.new_scan")}
             </button>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#00A86B]" size={48} />
            <p className="text-[#00A86B] font-black uppercase tracking-[0.2em] animate-pulse text-xs">{t("scanner.step_analyze")}</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}