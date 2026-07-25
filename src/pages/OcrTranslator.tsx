"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Upload, Languages, ArrowRightLeft, Download, 
  Share2, RefreshCw, Loader2, ChevronDown, Crown,
  Check, X, Image as ImageIcon
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
  { code: "auto", name: "Автоопределение", flag: "🔍" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "uz", name: "O'zbek", flag: "🇺🇿" },
  { code: "tj", name: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "ky", name: "Кыргызча", flag: "🇰🇬" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

type Step = "upload" | "configure" | "processing" | "result";

export default function OcrTranslator() {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("upload");
  const [image, setImage] = useState<string | null>(null);
  const [translatedImage, setTranslatedImage] = useState<string | null>(null);
  const [ocrBlocks, setOcrBlocks] = useState<OCRBlock[]>([]);
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [detectedLang, setDetectedLang] = useState<string>("ru");
  const [sourceLang, setSourceLang] = useState<LanguageCode>("auto");
  const [targetLang, setTargetLang] = useState<LanguageCode>("uz");
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
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
      setImage(dataUrl);
      setStep("configure");
    };
    reader.readAsDataURL(file);
  };

  const swapLanguages = () => {
    if (sourceLang === "auto") return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  const processTranslation = async () => {
    if (!image) return;
    
    setIsProcessing(true);
    setStep("processing");
    setProgress("Распознавание текста на изображении...");
    setProgressPercent(20);

    try {
      const ocrResult = await ocrService.recognizeText(image);
      setOcrBlocks(ocrResult.blocks);
      setRecognizedText(ocrResult.text);

      const detected = translationService.detectLanguage(ocrResult.text);
      setDetectedLang(detected);
      
      const finalSource = sourceLang === "auto" ? detected : sourceLang;
      
      if (finalSource === targetLang) {
        toast.error("Выберите другой язык перевода");
        setStep("configure");
        setIsProcessing(false);
        return;
      }

      setProgressPercent(40);
      setProgress(`Определён язык: ${LANGUAGES.find(l => l.code === finalSource)?.name || finalSource}`);

      const translations = new Map<number, string>();
      const totalBlocks = ocrResult.blocks.length;
      
      for (let i = 0; i < totalBlocks; i++) {
        const block = ocrResult.blocks[i];
        if (block.text.trim()) {
          const translation = await translationService.translate(
            block.text,
            finalSource,
            targetLang
          );
          translations.set(i, translation.translatedText);
        }
        
        const percent = 40 + Math.floor(((i + 1) / totalBlocks) * 40);
        setProgressPercent(percent);
        setProgress(`Перевод блока ${i + 1} из ${totalBlocks}...`);
      }

      setProgressPercent(85);
      setProgress("Создание нового изображения...");

      const resultImage = await imageTranslator.createTranslatedImage({
        image,
        blocks: ocrResult.blocks,
        translations,
        fontFamily: "Inter, sans-serif"
      });

      setTranslatedImage(resultImage);
      setProgressPercent(100);
      setProgress("Готово!");

      await saveToHistory(image, resultImage, finalSource, targetLang);

      if (!isPremium) {
        await subscriptionManager.incrementUsage("ocr_scan");
        const access = await subscriptionManager.checkAccess("ocr_scan");
        setRemaining(access.remaining);
      }

      setStep("result");
      toast.success("Перевод завершён!");
    } catch (error) {
      console.error("Translation failed:", error);
      toast.error("Ошибка при переводе. Попробуйте другое фото.");
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
      if (!userPhone) return;

      await supabase.from("ocr_history").insert({
        user_id: userPhone,
        original_image: original.slice(0, 500),
        translated_image: translated.slice(0, 500),
        source_language: src,
        target_language: tgt,
        recognized_text: recognizedText.slice(0, 1000),
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Failed to save history:", e);
    }
  };

  const downloadImage = () => {
    if (!translatedImage) return;
    const link = document.createElement('a');
    link.href = translatedImage;
    link.download = `vaxta-translated-${Date.now()}.jpg`;
    link.click();
    toast.success("Изображение сохранено");
  };

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

  const reset = () => {
    setImage(null);
    setTranslatedImage(null);
    setOcrBlocks([]);
    setRecognizedText("");
    setStep("upload");
  };

  const getLanguageOption = (code: LanguageCode): LanguageOption => {
    return LANGUAGES.find(l => l.code === code) || LANGUAGES[1];
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="AI Lens Переводчик" showBack />

      <main className="px-5 space-y-5 mt-2 flex-1">
        {/* Premium Badge / Usage */}
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
          {step === "configure" && image && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-[#1A3D2E] shadow-2xl">
                <img src={image} alt="Original" className="w-full h-full object-contain bg-[#0C1F1A]" />
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-[#06140F]/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase text-[#5C7A6D] border border-white/10">
                  Оригинал
                </div>
              </div>

              <div className="vaqta-glass p-5 border-[#1A3D2E] space-y-4">
                <p className="text-xs font-black uppercase text-[#5C7A6D] text-center">
                  Выберите язык перевода
                </p>
                
                <div className="flex items-center gap-2">
                  {/* Source Language */}
                  <div className="flex-1">
                    <button
                      onClick={() => setIsLangMenuOpen(true)}
                      className="w-full p-4 bg-[#06140F] border border-[#1A3D2E] rounded-2xl flex flex-col items-center gap-1 hover:border-[#0AA86E] transition"
                    >
                      <span className="text-2xl">{getLanguageOption(sourceLang).flag}</span>
                      <p className="text-[10px] text-[#5C7A6D] uppercase">С языка</p>
                      <p className="text-xs font-bold">{getLanguageOption(sourceLang).name}</p>
                    </button>
                  </div>

                  {/* Swap Button */}
                  <button
                    onClick={swapLanguages}
                    disabled={sourceLang === "auto"}
                    className="p-3 rounded-xl bg-[#0AA86E]/10 text-[#0AA86E] hover:bg-[#0AA86E]/20 transition disabled:opacity-30"
                  >
                    <ArrowRightLeft size={20} />
                  </button>

                  {/* Target Language */}
                  <div className="flex-1">
                    <button
                      onClick={() => setIsLangMenuOpen(true)}
                      className="w-full p-4 bg-[#06140F] border border-[#1A3D2E] rounded-2xl flex flex-col items-center gap-1 hover:border-[#0AA86E] transition"
                    >
                      <span className="text-2xl">{getLanguageOption(targetLang).flag}</span>
                      <p className="text-[10px] text-[#5C7A6D] uppercase">На язык</p>
                      <p className="text-xs font-bold">{getLanguageOption(targetLang).name}</p>
                    </button>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={processTranslation}
                  disabled={isProcessing}
                  className="w-full h-14 bg-gradient-to-r from-[#0AA86E] via-[#2563EB] to-[#7C3AED] rounded-2xl font-black text-white text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Languages size={20} />
                  )}
                  {isProcessing ? "Обработка..." : "Перевести изображение"}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-[10px] font-black uppercase text-[#5C7A6D]">Оригинал</p>
                    {detectedLang && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-[#5C7A6D]">
                        {getLanguageOption(detectedLang as LanguageCode).flag}
                      </span>
                    )}
                  </div>
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#1A3D2E] shadow-lg">
                    <img src={image!} alt="Original" className="w-full h-full object-contain bg-[#0C1F1A]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-[10px] font-black uppercase text-[#0AA86E]">Перевод</p>
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#0AA86E]/10 rounded text-[#0AA86E]">
                      {getLanguageOption(targetLang).flag}
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

              {/* Recognized Text */}
              {recognizedText && (
                <div className="vaqta-glass p-4 border-[#1A3D2E] space-y-2">
                  <p className="text-[10px] font-black uppercase text-[#5C7A6D]">Распознанный текст:</p>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                    {recognizedText}
                  </p>
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
            onClick={() => setIsLangMenuOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-sm vaqta-glass border-[#1A3D2E] rounded-[2rem] p-6 space-y-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase">Выберите языки</p>
                <button onClick={() => setIsLangMenuOpen(false)} className="text-[#5C7A6D]">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-[#5C7A6D] mb-2">С языка (оригинал):</p>
                  <div className="grid grid-cols-2 gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={`src-${lang.code}`}
                        onClick={() => {
                          setSourceLang(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`p-3 rounded-xl flex items-center gap-2 transition ${
                          sourceLang === lang.code
                            ? "bg-[#0AA86E] text-white shadow-lg vaqta-glow"
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-xs font-bold">{lang.name}</span>
                        {sourceLang === lang.code && <Check size={14} className="ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase text-[#5C7A6D] mb-2">На язык (перевод):</p>
                  <div className="grid grid-cols-2 gap-2">
                    {LANGUAGES.filter(l => l.code !== "auto").map((lang) => (
                      <button
                        key={`tgt-${lang.code}`}
                        onClick={() => {
                          setTargetLang(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`p-3 rounded-xl flex items-center gap-2 transition ${
                          targetLang === lang.code
                            ? "bg-[#0AA86E] text-white shadow-lg vaqta-glow"
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-xs font-bold">{lang.name}</span>
                        {targetLang === lang.code && <Check size={14} className="ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}