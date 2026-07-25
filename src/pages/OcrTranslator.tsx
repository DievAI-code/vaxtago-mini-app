"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Upload, Languages, ArrowRightLeft, Download, 
  Share2, RefreshCw, Loader2, Crown,
  Check, X, ChevronDown
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { ocrService, translationService, imageTranslator } from "@/services/ocr";
import { OCRBlock } from "@/services/ocr/ocrService";
import { subscriptionManager } from "@/lib/subscriptionManager";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type LanguageCode = "ru" | "uz" | "tj" | "en" | "ky" | "auto";

interface LanguageOption {
  code: LanguageCode;
  name: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "auto", name: "Авто", flag: "🔍" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "uz", name: "O'zbek", flag: "🇺🇿" },
  { code: "tj", name: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "ky", name: "Кыргызча", flag: "🇰🇬" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

type Step = "upload" | "configure" | "processing" | "result";

export default function OcrTranslator() {
  const { t } = useLanguage();
  
  // State
  const [step, setStep] = useState<Step>("upload");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [translatedImage, setTranslatedImage] = useState<string | null>(null);
  
  const [ocrText, setOcrText] = useState<string>("");
  const [ocrBlocks, setOcrBlocks] = useState<OCRBlock[]>([]);
  const [ocrLanguage, setOcrLanguage] = useState<string>("");
  
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("auto");
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("uz");
  const [detectedLanguage, setDetectedLanguage] = useState<string>("ru");
  
  const [translatedTexts, setTranslatedTexts] = useState<Map<number, string>>(new Map());
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<"source" | "target" | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [remaining, setRemaining] = useState<number>(5);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    const premium = await subscriptionManager.isPremium();
    setIsPremium(premium);
    if (!premium) {
      const access = await subscriptionManager.checkAccess("ocr_scan");
      setRemaining(access.remaining);
    }
  };

  // Handle file selection
  const handleImageSelect = async (file: File) => {
    if (!isPremium) {
      const access = await subscriptionManager.checkAccess("ocr_scan");
      if (!access.allowed) {
        toast.error("Лимит переводов исчерпан. Обновитесь до Premium.");
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setOriginalImage(dataUrl);
      setStep("configure");
      console.log("[OCR] Image loaded, ready for configuration");
    };
    reader.readAsDataURL(file);
  };

  // Swap languages
  const swapLanguages = () => {
    if (sourceLanguage === "auto") {
      toast.info("Сначала выберите конкретный язык источника");
      return;
    }
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  };

  // Main translation pipeline
  const processTranslation = async () => {
    if (!originalImage) {
      toast.error("Сначала загрузите изображение");
      return;
    }

    setIsProcessing(true);
    setStep("processing");
    setProgress("Распознавание текста на изображении...");
    setProgressPercent(10);

    try {
      // STEP 1: OCR — recognize text
      console.log("[OCR PIPELINE] Step 1: OCR recognition");
      const ocrResult = await ocrService.recognizeText(originalImage);
      setOcrText(ocrResult.text);
      setOcrBlocks(ocrResult.blocks);
      setOcrLanguage(ocrResult.language);
      
      console.log("[OCR PIPELINE] Recognized text:", ocrResult.text);
      console.log("[OCR PIPELINE] Blocks:", ocrResult.blocks.length);
      console.log("[OCR PIPELINE] Detected language:", ocrResult.language);

      if (!ocrResult.text.trim()) {
        throw new Error("Текст на изображении не найден");
      }

      setProgressPercent(25);

      // STEP 2: Detect language if auto
      let finalSourceLang: string = sourceLanguage;
      if (sourceLanguage === "auto") {
        const detected = translationService.detectLanguage(ocrResult.text);
        finalSourceLang = detected;
        setDetectedLanguage(detected);
        console.log(`[OCR PIPELINE] Auto-detected language: ${detected}`);
      } else {
        setDetectedLanguage(sourceLanguage);
      }

      if (finalSourceLang === targetLanguage) {
        toast.error("Язык оригинала совпадает с целевым языком");
        setStep("configure");
        setIsProcessing(false);
        return;
      }

      setProgress(`Определён язык: ${LANGUAGES.find(l => l.code === finalSourceLang)?.name || finalSourceLang}`);
      setProgressPercent(30);

      // STEP 3: Translate each block
      const translations = new Map<number, string>();
      const totalBlocks = ocrResult.blocks.length;
      
      for (let i = 0; i < totalBlocks; i++) {
        const block = ocrResult.blocks[i];
        if (block.text.trim()) {
          const result = await translationService.translate(
            block.text,
            finalSourceLang,
            targetLanguage
          );
          translations.set(i, result.translatedText);
        }
        
        const percent = 30 + Math.floor(((i + 1) / Math.max(totalBlocks, 1)) * 40);
        setProgressPercent(percent);
        setProgress(`Перевод блока ${i + 1} из ${totalBlocks}...`);
      }

      setTranslatedTexts(translations);
      
      // Log all translations
      console.log("[OCR PIPELINE] All translations:");
      translations.forEach((text, idx) => {
        console.log(`  Block ${idx}: "${ocrResult.blocks[idx]?.text}" → "${text}"`);
      });

      setProgressPercent(75);
      setProgress("Создание нового изображения с переводом...");

      // STEP 4: Generate translated image
      const resultImage = await imageTranslator.createTranslatedImage({
        image: originalImage,
        blocks: ocrResult.blocks,
        translations,
        fontFamily: "Inter, sans-serif"
      });

      setTranslatedImage(resultImage);
      setProgressPercent(100);
      setProgress("Готово!");

      console.log("[OCR PIPELINE] Complete! Final image created");

      // Save to history
      await saveToHistory(originalImage, resultImage, finalSourceLang, targetLanguage);

      // Increment usage
      if (!isPremium) {
        await subscriptionManager.incrementUsage("ocr_scan");
        const access = await subscriptionManager.checkAccess("ocr_scan");
        setRemaining(access.remaining);
      }

      setStep("result");
      toast.success("Перевод завершён!");
    } catch (error: any) {
      console.error("[OCR PIPELINE] Error:", error);
      toast.error(error.message || "Ошибка при переводе. Попробуйте другое фото.");
      setStep("configure");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToHistory = async (
    original: string,
    translated: string,
    src: string,
    tgt: string
  ) => {
    try {
      const userPhone = localStorage.getItem("vaxtago_user_phone");
      if (!userPhone || !supabase) return;

      await supabase.from("ocr_history").insert({
        user_id: userPhone,
        original_image: original.slice(0, 500),
        translated_image: translated.slice(0, 500),
        source_language: src,
        target_language: tgt,
        recognized_text: ocrText.slice(0, 1000),
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn("[OCR] Failed to save history:", e);
    }
  };

  // Download translated image
  const downloadImage = () => {
    if (!translatedImage) return;
    const link = document.createElement('a');
    link.href = translatedImage;
    link.download = `vaxta-translated-${Date.now()}.jpg`;
    link.click();
    toast.success("Изображение сохранено");
  };

  // Share translated image
  const shareImage = async () => {
    if (!translatedImage) return;
    
    try {
      const response = await fetch(translatedImage);
      const blob = await response.blob();
      const file = new File([blob], "vaxta-translated.jpg", { type: "image/jpeg" });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "VAQTA AI — Перевод изображения"
        });
      } else {
        await navigator.clipboard.writeText(translatedImage);
        toast.success("Ссылка скопирована");
      }
    } catch {
      toast.error("Не удалось поделиться");
    }
  };

  // Reset
  const reset = () => {
    setOriginalImage(null);
    setTranslatedImage(null);
    setOcrText("");
    setOcrBlocks([]);
    setTranslatedTexts(new Map());
    setStep("upload");
  };

  const getLanguageOption = (code: LanguageCode): LanguageOption => {
    return LANGUAGES.find(l => l.code === code) || LANGUAGES[1];
  };

  const effectiveSource = sourceLanguage === "auto" ? detectedLanguage : sourceLanguage;

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="AI Lens Переводчик" showBack />

      <main className="px-5 space-y-5 mt-2 flex-1">
        {/* Premium Badge */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
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
            <button className="px-3 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#F5D17E] text-black rounded-lg text-[10px] font-black uppercase">
              PRO
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* UPLOAD STEP */}
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <div className="text-center space-y-3 py-8">
                <motion.div
                  animate={{ 
                    boxShadow: ["0 0 0 0 rgba(0,168,110,0.4)", "0 0 0 20px rgba(0,168,110,0)", "0 0 0 0 rgba(0,168,110,0)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-[#0AA86E] via-[#2563EB] to-[#7C3AED] flex items-center justify-center mx-auto shadow-2xl"
                >
                  <Languages size={48} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-black">AI Lens Переводчик</h2>
                <p className="text-xs text-[#5C7A6D] max-w-xs mx-auto">
                  Загрузите фото — AI распознает текст, переведёт и заменит его прямо на изображении
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => cameraInputRef.current?.click()}
                  className="vaqta-glass p-6 border-[#1A3D2E] flex flex-col items-center gap-3 active:scale-95 transition hover:border-[#0AA86E]"
                >
                  <Camera className="text-[#0AA86E]" size={32} />
                  <span className="text-xs font-black uppercase">Камера</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="vaqta-glass p-6 border-[#1A3D2E] flex flex-col items-center gap-3 active:scale-95 transition hover:border-[#D4AF37]"
                >
                  <Upload className="text-[#D4AF37]" size={32} />
                  <span className="text-xs font-black uppercase">Галерея</span>
                </motion.button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
              />

              <div className="vaqta-glass p-4 border-[#1A3D2E] space-y-3">
                <p className="text-[10px] font-black uppercase text-[#5C7A6D]">Поддерживаемые форматы:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: "📄", label: "Документы" },
                    { icon: "🎫", label: "Билеты" },
                    { icon: "🏠", label: "Адреса" },
                    { icon: "📱", label: "Скриншоты" },
                    { icon: "🛂", label: "Паспорта" },
                    { icon: "📋", label: "Объявления" },
                  ].map((type) => (
                    <div key={type.label} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-[10px] font-medium text-slate-300">{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* CONFIGURE STEP */}
          {step === "configure" && originalImage && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Image Preview */}
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-[#1A3D2E] shadow-2xl">
                <img src={originalImage} alt="Original" className="w-full h-full object-contain bg-[#0C1F1A]" />
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-[#06140F]/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase text-[#5C7A6D] border border-white/10">
                  Оригинал
                </div>
              </div>

              {/* Language Selection */}
              <div className="vaqta-glass p-5 border-[#1A3D2E] space-y-4">
                <p className="text-xs font-black uppercase text-[#5C7A6D] text-center">
                  Выберите язык перевода
                </p>
                
                <div className="flex items-center gap-2">
                  {/* Source Language */}
                  <div className="flex-1">
                    <button
                      onClick={() => setIsLangMenuOpen("source")}
                      className="w-full p-4 bg-[#06140F] border border-[#1A3D2E] rounded-2xl flex flex-col items-center gap-1 hover:border-[#0AA86E] transition"
                    >
                      <span className="text-2xl">{getLanguageOption(sourceLanguage).flag}</span>
                      <p className="text-[10px] text-[#5C7A6D] uppercase">С языка</p>
                      <p className="text-xs font-bold">{getLanguageOption(sourceLanguage).name}</p>
                    </button>
                  </div>

                  {/* Swap */}
                  <button
                    onClick={swapLanguages}
                    disabled={sourceLanguage === "auto"}
                    className="p-3 rounded-xl bg-[#0AA86E]/10 text-[#0AA86E] hover:bg-[#0AA86E]/20 transition disabled:opacity-30"
                    aria-label="Swap languages"
                  >
                    <ArrowRightLeft size={20} />
                  </button>

                  {/* Target Language */}
                  <div className="flex-1">
                    <button
                      onClick={() => setIsLangMenuOpen("target")}
                      className="w-full p-4 bg-[#06140F] border border-[#1A3D2E] rounded-2xl flex flex-col items-center gap-1 hover:border-[#0AA86E] transition"
                    >
                      <span className="text-2xl">{getLanguageOption(targetLanguage).flag}</span>
                      <p className="text-[10px] text-[#5C7A6D] uppercase">На язык</p>
                      <p className="text-xs font-bold">{getLanguageOption(targetLanguage).name}</p>
                    </button>
                  </div>
                </div>

                {/* Translate Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={processTranslation}
                  disabled={isProcessing}
                  className="w-full h-14 bg-gradient-to-r from-[#0AA86E] via-[#2563EB] to-[#7C3AED] rounded-2xl font-black text-white text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  <Languages size={20} />
                  <span>Перевести изображение</span>
                </motion.button>

                <button
                  onClick={reset}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl text-[#5C7A6D] text-xs font-black uppercase hover:text-white transition"
                >
                  Выбрать другое фото
                </button>
              </div>
            </motion.div>
          )}

          {/* PROCESSING STEP */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 space-y-6"
            >
              <div className="relative">
                <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-[#0AA86E] via-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-2xl">
                  <Loader2 className="animate-spin text-white" size={48} />
                </div>
                <div className="absolute inset-0 rounded-[2rem] bg-[#0AA86E]/20 animate-pulse blur-xl" />
              </div>
              <div className="text-center space-y-2 max-w-sm">
                <p className="text-base font-black text-[#0AA86E]">{progress}</p>
                <p className="text-xs text-[#5C7A6D]">
                  AI анализирует изображение, распознаёт текст и переводит
                </p>
              </div>
              <div className="w-full max-w-xs h-2 bg-[#1A3D2E] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-[#0AA86E] to-[#7C3AED]"
                />
              </div>
              <p className="text-[10px] text-[#5C7A6D] uppercase tracking-widest font-bold">
                {progressPercent}%
              </p>
            </motion.div>
          )}

          {/* RESULT STEP */}
          {step === "result" && translatedImage && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Side by Side Comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-[10px] font-black uppercase text-[#5C7A6D]">Оригинал</p>
                    <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-[#5C7A6D]">
                      {getLanguageOption(effectiveSource as LanguageCode).flag}
                    </span>
                  </div>
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#1A3D2E] shadow-lg">
                    <img src={originalImage!} alt="Original" className="w-full h-full object-contain bg-[#0C1F1A]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-[10px] font-black uppercase text-[#0AA86E]">Перевод</p>
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#0AA86E]/10 rounded text-[#0AA86E]">
                      {getLanguageOption(targetLanguage).flag}
                    </span>
                  </div>
                  <motion.div
                    initial={{ boxShadow: "0 0 0 rgba(0,168,110,0)" }}
                    animate={{ boxShadow: ["0 0 0 rgba(0,168,110,0)", "0 0 30px rgba(0,168,110,0.3)", "0 0 0 rgba(0,168,110,0)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#0AA86E]/30"
                  >
                    <img src={translatedImage} alt="Translated" className="w-full h-full object-contain bg-[#0C1F1A]" />
                  </motion.div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadImage}
                  className="vaqta-glass p-4 border-[#1A3D2E] flex flex-col items-center gap-2 active:scale-95 transition hover:border-[#0AA86E]"
                >
                  <Download className="text-[#0AA86E]" size={24} />
                  <span className="text-[10px] font-black uppercase">Скачать</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={shareImage}
                  className="vaqta-glass p-4 border-[#1A3D2E] flex flex-col items-center gap-2 active:scale-95 transition hover:border-[#2563EB]"
                >
                  <Share2 className="text-[#2563EB]" size={24} />
                  <span className="text-[10px] font-black uppercase">Поделиться</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={reset}
                  className="vaqta-glass p-4 border-[#1A3D2E] flex flex-col items-center gap-2 active:scale-95 transition hover:border-[#7C3AED]"
                >
                  <RefreshCw className="text-[#7C3AED]" size={24} />
                  <span className="text-[10px] font-black uppercase">Новый</span>
                </motion.button>
              </div>

              {/* Recognized & Translated Text */}
              {ocrText && (
                <div className="vaqta-glass p-4 border-[#1A3D2E] space-y-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#5C7A6D] mb-1">
                      Распознанный текст ({getLanguageOption(effectiveSource as LanguageCode).name}):
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {ocrText}
                    </p>
                  </div>
                  {translatedTexts.size > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#0AA86E] mb-1">
                        Перевод ({getLanguageOption(targetLanguage).name}):
                      </p>
                      <p className="text-xs text-white leading-relaxed">
                        {Array.from(translatedTexts.values()).join(' ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Language Selector Modal */}
      <AnimatePresence>
        {isLangMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsLangMenuOpen(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-sm vaqta-glass border-[#1A3D2E] rounded-[2rem] p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase">
                  {isLangMenuOpen === "source" ? "Язык оригинала" : "Язык перевода"}
                </p>
                <button onClick={() => setIsLangMenuOpen(null)} className="text-[#5C7A6D]">
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {(isLangMenuOpen === "source" ? LANGUAGES : LANGUAGES.filter(l => l.code !== "auto")).map((lang) => {
                  const selected = isLangMenuOpen === "source" 
                    ? sourceLanguage === lang.code 
                    : targetLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        if (isLangMenuOpen === "source") {
                          setSourceLanguage(lang.code);
                        } else {
                          setTargetLanguage(lang.code);
                        }
                        setIsLangMenuOpen(null);
                      }}
                      className={`p-3 rounded-xl flex items-center gap-2 transition ${
                        selected
                          ? "bg-[#0AA86E] text-white shadow-lg vaqta-glow"
                          : "bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-xs font-bold">{lang.name}</span>
                      {selected && <Check size={14} className="ml-auto" />}
                    </button>
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