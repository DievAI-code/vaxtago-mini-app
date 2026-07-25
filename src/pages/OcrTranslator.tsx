"use client";

import { useState, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Upload, Languages, ArrowRightLeft, Download, 
  Share2, RefreshCw, Loader2, Crown,
  Check, X, FileImage, LayoutGrid, Columns
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { subscriptionManager } from "@/lib/subscriptionManager";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { imageTranslationService, ProcessResult } from "@/services/imageTranslationService";

type LanguageCode = "ru" | "uz_lat" | "uz_cyr" | "en" | "auto";

interface LanguageOption {
  code: LanguageCode;
  name: string;
  flag: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "auto", name: "Auto", nativeName: "Авто", flag: "🔍" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "uz_lat", name: "Uzbek (Latin)", nativeName: "O'zbekcha", flag: "🇺🇿" },
  { code: "uz_cyr", name: "Uzbek (Cyrillic)", nativeName: "Ўзбекча", flag: "🇺🇿" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
];

type Step = "upload" | "configure" | "processing" | "result";
type ViewMode = "side" | "compare";

const LangPill = memo(function LangPill({ lang, onClick, isActive }: { lang: LanguageOption; onClick: () => void; isActive: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl flex items-center gap-2 transition ${
        isActive ? "bg-[#0AA86E] text-white shadow-lg vaqta-glow" : "bg-white/5 text-slate-300 hover:bg-white/10"
      }`}
    >
      <span className="text-xl">{lang.flag}</span>
      <span className="text-xs font-bold">{lang.nativeName}</span>
      {isActive && <Check size={14} className="ml-auto" />}
    </button>
  );
});

export default function OcrTranslator() {
  const { t } = useLanguage();

  // State
  const [step, setStep] = useState<Step>("upload");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [translatedImage, setTranslatedImage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("ru");
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("uz_lat");
  const [effectiveSource, setEffectiveSource] = useState<string>("ru");

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  const [isLangMenuOpen, setIsLangMenuOpen] = useState<"source" | "target" | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [remaining, setRemaining] = useState<number>(5);

  const [viewMode, setViewMode] = useState<ViewMode>("side");
  const [sliderPos, setSliderPos] = useState(50);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const compareContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const premium = await subscriptionManager.isPremium();
      setIsPremium(premium);
      if (!premium) {
        const access = await subscriptionManager.checkAccess("ocr_scan");
        setRemaining(access.remaining);
      }
    })();
  }, []);

  const handleImageSelect = async (file: File) => {
    if (!isPremium) {
      const access = await subscriptionManager.checkAccess("ocr_scan");
      if (!access.allowed) {
        toast.error(t("premium.feature_locked") || "Лимит исчерпан. Premium.");
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setOriginalImage(dataUrl);
      setResult(null);
      setTranslatedImage(null);
      setStep("configure");
    };
    reader.readAsDataURL(file);
  };

  const swapLanguages = () => {
    if (sourceLanguage === "auto") {
      toast.info("Сначала выберите конкретный язык оригинала");
      return;
    }
    const oldSource = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(oldSource);
  };

  const processTranslation = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setStep("processing");
    setProgress(t("scanner.step_ocr") || "Распознаю текст...");
    setProgressPercent(15);

    try {
      const target = targetLanguage === "auto" ? "uz_lat" : targetLanguage;
      const processResult = await imageTranslationService.processWithAI(originalImage, target);

      setProgressPercent(80);
      setProgress(t("scanner.step_translate") || "Перевожу...");

      setEffectiveSource(processResult.analysis.sourceLanguage);
      setTranslatedImage(processResult.translated);
      setResult(processResult);

      try {
        const userPhone = localStorage.getItem("vaxtago_user_phone");
        if (userPhone) {
          await supabase.from("ocr_history").insert({
            user_id: userPhone,
            original_image: processResult.original.slice(0, 500),
            translated_image: processResult.translated.slice(0, 500),
            source_language: processResult.analysis.sourceLanguage,
            target_language: processResult.analysis.targetLanguage,
            recognized_text: processResult.analysis.text.slice(0, 1000),
            created_at: new Date().toISOString(),
          });
        }
      } catch {}

      if (!isPremium) {
        await subscriptionManager.incrementUsage("ocr_scan");
        const access = await subscriptionManager.checkAccess("ocr_scan");
        setRemaining(access.remaining);
      }

      setStep("result");
      toast.success(t("scanner.result_ready"));
    } catch (error: any) {
      toast.error(error?.message || t("scanner.error_ai"));
      setStep("configure");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!translatedImage) return;
    const link = document.createElement("a");
    link.href = translatedImage;
    link.download = `vaqta-translated-${Date.now()}.jpg`;
    link.click();
    toast.success(t("common.done"));
  };

  const shareImage = async () => {
    if (!translatedImage) return;
    try {
      const response = await fetch(translatedImage);
      const blob = await response.blob();
      const file = new File([blob], "vaqta-translated.jpg", { type: "image/jpeg" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "VAQTA AI" });
      } else {
        await navigator.clipboard.writeText(translatedImage);
        toast.success("Ссылка скопирована");
      }
    } catch {
      toast.error("Не удалось поделиться");
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setTranslatedImage(null);
    setResult(null);
    setStep("upload");
  };

  const sourceOpt = LANGUAGES.find((l) => l.code === sourceLanguage) || LANGUAGES[1];
  const targetOpt = LANGUAGES.find((l) => l.code === targetLanguage) || LANGUAGES[1];
  const detectedSource = LANGUAGES.find((l) => l.code === effectiveSource) || sourceOpt;

  // Compare slider handlers
  const handleSliderMove = (clientX: number) => {
    if (!compareContainerRef.current) return;
    const rect = compareContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title={t("scanner.title")} showBack />

      <main className="px-5 space-y-5 mt-2 flex-1">
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="vaqta-glass p-3 border-[#D4AF37]/30 flex items-center gap-3"
          >
            <Crown className="text-[#D4AF37]" size={20} />
            <div className="flex-1">
              <p className="text-xs font-bold text-[#D4AF37]">Free версия</p>
              <p className="text-[10px] text-[#5C7A6D]">
                Осталось переводов: <span className="text-white font-bold">{remaining}</span> из 5
              </p>
            </div>
            <button className="px-3 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#F5D17E] text-black rounded-lg text-[10px] font-black uppercase">PRO</button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
              <div className="text-center space-y-3 py-6">
                <motion.div
                  animate={{ boxShadow: ["0 0 0 0 rgba(0,168,110,0.4)", "0 0 0 20px rgba(0,168,110,0)", "0 0 0 0 rgba(0,168,110,0)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-[#0AA86E] via-[#2563EB] to-[#7C3AED] flex items-center justify-center mx-auto shadow-2xl"
                >
                  <Languages size={48} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-black">{t("scanner.title")}</h2>
                <p className="text-xs text-[#5C7A6D] max-w-xs mx-auto">{t("scanner.desc")}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => cameraInputRef.current?.click()} className="vaqta-glass p-6 border-[#1A3D2E] flex flex-col items-center gap-3 active:scale-95 transition hover:border-[#0AA86E]">
                  <Camera className="text-[#0AA86E]" size={32} />
                  <span className="text-xs font-black uppercase">{t("scanner.take_photo")}</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => fileInputRef.current?.click()} className="vaqta-glass p-6 border-[#1A3D2E] flex flex-col items-center gap-3 active:scale-95 transition hover:border-[#D4AF37]">
                  <Upload className="text-[#D4AF37]" size={32} />
                  <span className="text-xs font-black uppercase">{t("scanner.gallery")}</span>
                </motion.button>
              </div>

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />
            </motion.div>
          )}

          {step === "configure" && originalImage && (
            <motion.div key="configure" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-[#1A3D2E] shadow-2xl">
                <img src={originalImage} alt="Original" className="w-full h-full object-contain bg-[#0C1F1A]" />
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-[#06140F]/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase text-[#5C7A6D] border border-white/10">
                  {t("scanner.original")}
                </div>
              </div>

              <div className="vaqta-glass p-5 border-[#1A3D2E] space-y-4">
                <div className="flex items-center gap-2 justify-center">
                  <Languages className="text-[#0AA86E]" size={20} />
                  <p className="text-sm font-black uppercase tracking-widest text-white">
                    {t("scanner.translate_photo")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => setIsLangMenuOpen("source")} className="flex-1 p-4 bg-[#06140F] border border-[#1A3D2E] rounded-2xl flex flex-col items-center gap-1 hover:border-[#0AA86E] transition">
                    <span className="text-2xl">{sourceOpt.flag}</span>
                    <p className="text-[10px] text-[#5C7A6D] uppercase font-bold">{t("scanner.select_source_lang")}</p>
                    <p className="text-xs font-bold text-white">{sourceOpt.nativeName}</p>
                  </button>
                  <button onClick={swapLanguages} disabled={sourceLanguage === "auto"} className="p-3 rounded-xl bg-[#0AA86E]/10 text-[#0AA86E] hover:bg-[#0AA86E]/20 transition disabled:opacity-30">
                    <ArrowRightLeft size={20} />
                  </button>
                  <button onClick={() => setIsLangMenuOpen("target")} className="flex-1 p-4 bg-[#06140F] border border-[#1A3D2E] rounded-2xl flex flex-col items-center gap-1 hover:border-[#D4AF37] transition">
                    <span className="text-2xl">{targetOpt.flag}</span>
                    <p className="text-[10px] text-[#5C7A6D] uppercase font-bold">{t("scanner.select_target_lang")}</p>
                    <p className="text-xs font-bold text-white">{targetOpt.nativeName}</p>
                  </button>
                </div>

                <motion.button whileTap={{ scale: 0.98 }} onClick={processTranslation} disabled={isProcessing} className="w-full h-14 bg-gradient-to-r from-[#0AA86E] via-[#2563EB] to-[#7C3AED] rounded-2xl font-black text-white text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform disabled:opacity-50">
                  <Languages size={20} />
                  <span>{sourceOpt.nativeName} → {targetOpt.nativeName}</span>
                </motion.button>

                <button onClick={reset} className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl text-[#5C7A6D] text-xs font-black uppercase hover:text-white transition">
                  {t("scanner.new_scan")}
                </button>
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-[#0AA86E] via-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-2xl">
                  <Loader2 className="animate-spin text-white" size={48} />
                </div>
                <div className="absolute inset-0 rounded-[2rem] bg-[#0AA86E]/20 animate-pulse blur-xl" />
              </div>
              <div className="text-center space-y-2 max-w-sm">
                <p className="text-base font-black text-[#0AA86E]">{progress}</p>
                <p className="text-xs text-[#5C7A6D]">AI распознаёт текст, переводит и рисует перевод на фото</p>
              </div>
              <div className="w-full max-w-xs h-2 bg-[#1A3D2E] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.5 }} className="h-full bg-gradient-to-r from-[#0AA86E] to-[#7C3AED]" />
              </div>
              <p className="text-[10px] text-[#5C7A6D] uppercase tracking-widest font-bold">{progressPercent}%</p>
            </motion.div>
          )}

          {step === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              {/* View mode toggle */}
              <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl">
                <button onClick={() => setViewMode("side")} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${viewMode === "side" ? "bg-[#0AA86E] text-white shadow-lg" : "text-[#5C7A6D]"}`}>
                  <Columns size={12} /> Side
                </button>
                <button onClick={() => setViewMode("compare")} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${viewMode === "compare" ? "bg-[#0AA86E] text-white shadow-lg" : "text-[#5C7A6D]"}`}>
                  <LayoutGrid size={12} /> {t("scanner.compare_mode") || "Сравнить"}
                </button>
              </div>

              {/* Side by side view */}
              {viewMode === "side" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-[10px] font-black uppercase text-[#5C7A6D]">{t("scanner.compare_before")}</p>
                      <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-[#5C7A6D]">{detectedSource.flag}</span>
                    </div>
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#1A3D2E] shadow-lg">
                      <img src={result.original} alt="Original" className="w-full h-full object-contain bg-[#0C1F1A]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-[10px] font-black uppercase text-[#0AA86E]">{t("scanner.compare_after")}</p>
                      <span className="text-[9px] px-1.5 py-0.5 bg-[#0AA86E]/10 rounded text-[#0AA86E]">{targetOpt.flag}</span>
                    </div>
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#0AA86E]/30">
                      <img src={result.translated} alt="Translated" className="w-full h-full object-contain bg-[#0C1F1A]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Compare slider view — До/После с перетаскиванием */}
              {viewMode === "compare" && (
                <div
                  ref={compareContainerRef}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[#1A3D2E] shadow-lg select-none"
                  onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e.clientX)}
                  onMouseDown={(e) => handleSliderMove(e.clientX)}
                  onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
                  onTouchStart={(e) => handleSliderMove(e.touches[0].clientX)}
                >
                  {/* Original (background) */}
                  <img src={result.original} alt="Original" className="absolute inset-0 w-full h-full object-contain bg-[#0C1F1A]" draggable={false} />
                  {/* Translated (foreground, clipped) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                  >
                    <img src={result.translated} alt="Translated" className="w-full h-full object-contain bg-[#0C1F1A]" draggable={false} />
                  </div>
                  {/* Slider line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)] pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-2xl flex items-center justify-center pointer-events-none"
                    style={{ left: `calc(${sliderPos}% - 20px)` }}
                  >
                    <ArrowRightLeft className="text-black" size={16} />
                  </div>
                  {/* Labels */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full text-[9px] font-black uppercase text-white border border-white/10">
                    {t("scanner.compare_before")} · {detectedSource.flag}
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#0AA86E]/90 backdrop-blur-md rounded-full text-[9px] font-black uppercase text-white border border-[#0AA86E]/40">
                    {t("scanner.compare_after")} · {targetOpt.flag}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-3">
                <motion.button whileTap={{ scale: 0.95 }} onClick={downloadImage} className="vaqta-glass p-4 border-[#1A3D2E] flex flex-col items-center gap-2 active:scale-95 transition hover:border-[#0AA86E]">
                  <Download className="text-[#0AA86E]" size={24} />
                  <span className="text-[10px] font-black uppercase">{t("scanner.download")}</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={shareImage} className="vaqta-glass p-4 border-[#1A3D2E] flex flex-col items-center gap-2 active:scale-95 transition hover:border-[#2563EB]">
                  <Share2 className="text-[#2563EB]" size={24} />
                  <span className="text-[10px] font-black uppercase">{t("scanner.share")}</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={reset} className="vaqta-glass p-4 border-[#1A3D2E] flex flex-col items-center gap-2 active:scale-95 transition hover:border-[#7C3AED]">
                  <RefreshCw className="text-[#7C3AED]" size={24} />
                  <span className="text-[10px] font-black uppercase">{t("scanner.new_scan")}</span>
                </motion.button>
              </div>

              {result.analysis.text && (
                <div className="vaqta-glass p-4 border-[#1A3D2E] space-y-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#5C7A6D] mb-1">
                      {t("scanner.original_text")} ({detectedSource.nativeName}):
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{result.analysis.text}</p>
                  </div>
                  {result.analysis.translatedText && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#0AA86E] mb-1">
                        {t("scanner.translation")} ({targetOpt.nativeName}):
                      </p>
                      <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">{result.analysis.translatedText}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Language picker modal */}
      <AnimatePresence>
        {isLangMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setIsLangMenuOpen(null)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="w-full max-w-sm vaqta-glass border-[#1A3D2E] rounded-[2rem] p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase">
                  {isLangMenuOpen === "source" ? t("scanner.select_source_lang") : t("scanner.select_target_lang")}
                </p>
                <button onClick={() => setIsLangMenuOpen(null)} className="text-[#5C7A6D]">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(isLangMenuOpen === "source" ? LANGUAGES : LANGUAGES.filter((l) => l.code !== "auto")).map((lang) => {
                  const selected = isLangMenuOpen === "source" ? sourceLanguage === lang.code : targetLanguage === lang.code;
                  return (
                    <LangPill key={lang.code} lang={lang} onClick={() => {
                      if (isLangMenuOpen === "source") setSourceLanguage(lang.code);
                      else setTargetLanguage(lang.code);
                      setIsLangMenuOpen(null);
                    }} isActive={selected} />
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}