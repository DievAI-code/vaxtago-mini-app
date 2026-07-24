"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Globe, ChevronRight, RefreshCw, CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { imageTranslationService } from "@/services/imageTranslationService";
import { subscription } from "@/services/subscription";
import { useLanguage } from "@/context/LanguageProvider";
import { Lang } from "@/i18n";
import { toast } from "sonner";

const TARGET_LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "uz", label: "O'zbekcha", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "kk", label: "Қазақша", flag: "🇰🇿" },
];

export default function Scanner() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ original: string; translated: string } | null>(null);
  const [targetLang, setTargetLang] = useState<Lang>(language);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    const access = await subscription.checkUserAccess("ocr");
    if (!access.allowed) {
      toast.error(t("premium.feature_locked") || "OCR limit tugadi.");
      return;
    }

    setLoading(true);
    try {
      const data = await imageTranslationService.processImage(file, targetLang);
      setResult(data);
      await subscription.trackUsage("ocr");
      toast.success(t("scanner.result_ready") || "Tarjima tayyor!");
    } catch {
      toast.error(t("scanner.error_ai") || "AI tarjimada xatolik.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="nav.scanner" showBack />
      
      <main className="p-6 space-y-6">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  targetLang === l.code ? "bg-[#00A86B] text-white shadow-lg" : "bg-white/5 text-slate-400"
                }`}
              >
                <span>{l.flag}</span>
                <span className="text-[10px]">{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        {!result ? (
          <div className="flex flex-col items-center justify-center py-12 gap-6">
            <div className="w-24 h-24 rounded-[2rem] vaqta-gradient flex items-center justify-center vaqta-glow shadow-2xl">
              <Camera size={40} className="text-white" />
            </div>
            <div className="text-center space-y-2 max-w-xs">
              <h2 className="text-xl font-black">{t("scanner.title")}</h2>
              <p className="text-xs text-[#5C7A6D] font-medium leading-relaxed">{t("scanner.desc")}</p>
            </div>

            <input 
              type="file" 
              className="hidden" 
              id="cam-input" 
              accept="image/*" 
              ref={fileRef}
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />

            <button 
              onClick={() => fileRef.current?.click()}
              className="w-full h-16 bg-[#00A86B] rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform text-xs text-white vaqta-glow"
            >
              {t("scanner.take_photo")} <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="vaqta-glass p-4 border-[#00A86B]/30 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase text-[#00A86B] flex items-center gap-1">
                    <CheckCircle size={14} /> AI Overlay Result ({targetLang.toUpperCase()})
                  </span>
                  <button onClick={() => setResult(null)} className="text-xs text-[#5C7A6D] hover:text-white flex items-center gap-1 font-bold">
                    <RefreshCw size={12} /> {t("scanner.new_scan")}
                  </button>
                </div>
                <img src={result.translated} className="w-full rounded-2xl max-h-80 object-contain bg-black/40" alt="Translated Overlay" />
             </div>

             <div className="vaqta-glass p-4 border-[#1A3D2E]">
                <h3 className="text-[10px] font-black uppercase text-[#5C7A6D] mb-2">{t("scanner.original_text")}</h3>
                <img src={result.original} className="w-full rounded-2xl max-h-48 object-cover opacity-80" alt="Original" />
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