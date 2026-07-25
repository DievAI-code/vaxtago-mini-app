"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Upload, Languages, ArrowRightLeft, Download, 
  Share2, RefreshCw, Check, Loader2, Image as ImageIcon,
  ChevronDown, Crown
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { ocrService, translationService, imageReplaceService } from "@/services/ocr";
import { OCRBlock } from "@/services/ocr/ocrService";
import { subscriptionManager } from "@/lib/subscriptionManager";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Language = "ru" | "uz" | "tj" | "en";
type TranslationDirection = "ru-uz" | "uz-ru" | "ru-tj" | "tj-ru" | "ru-en" | "en-ru";

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "uz", name: "O'zbek", flag: "🇺🇿" },
  { code: "tj", name: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

const DEFAULT_DIRECTION: TranslationDirection = "ru-uz";

export default function OcrTranslator() {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<"upload" | "select" | "processing" | "result">("upload");
  const [image, setImage] = useState<string | null>(null);
  const [translatedImage, setTranslatedImage] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState<Language>("ru");
  const [targetLang, setTargetLang] = useState<Language>("uz");
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [ocrResult, setOcrResult] = useState<{ text: string; blocks: OCRBlock[] } | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check premium status
  useState(() => {
    subscriptionManager.isPremium().then(setIsPremium);
  });

  const handleImageSelect = async (file: File) => {
    // Check limits for free users
    if (!isPremium) {
      const access = await subscriptionManager.checkAccess("ocr_scan");
      if (!access.allowed) {
        toast.error(t("premium.feature_locked") || "Лимит переводов исчерпан. Обновитесь до Premium.");
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setStep("select");
    };
    reader.readAsDataURL(file);
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  const processTranslation = async () => {
    if (!image) return;
    
    setIsProcessing(true);
    setStep("processing");
    setProgress("Распознавание текста...");

    try {
      // Step 1: OCR
      const ocr = await ocrService.recognizeText(image);
      setOcrResult({ text: ocr.text, blocks: ocr.blocks });
      setProgress("Перевод текста...");

      // Step 2: Translate each block
      const translatedBlocks: { original: OCRBlock; translated: string }[] = [];
      
      for (let i = 0; i < ocr.blocks.length; i++) {
        const block = ocr.blocks[i];
        setProgress(`Перевод ${i + 1}/${ocr.blocks.length}...`);
        
        const translation = await translationService.translateDocument(
          block.text,
          sourceLang,
          targetLang
        );
        
        translatedBlocks.push({
          original: block,
          translated: translation.translatedText
        });
      }

      setProgress("Создание изображения...");

      // Step 3: Replace text on image
      const resultImage = await imageReplaceService.replaceTextOnImage(
        image,
        translatedBlocks,
        {
          fontFamily: language === "uz" ? "Inter, sans-serif" : "Inter, sans-serif",
          textColor: "#1a1a1a",
          backgroundColor: "#ffffff"
        }
      );

      setTranslatedImage(resultImage);
      setStep("result");

      // Save to history
      await saveToHistory(image, resultImage);

      // Increment usage for free users
      if (!isPremium) {
        await subscriptionManager.incrementUsage("ocr_scan");
      }

      toast.success("Перевод завершен!");
    } catch (error) {
      console.error("Translation failed:", error);
      toast.error("Ошибка при переводе. Попробуйте другое фото.");
      setStep("select");
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  };

  const saveToHistory = async (original: string, translated: string) => {
    try {
      const userPhone = localStorage.getItem("vaxtago_user_phone");
      if (!userPhone) return;

      await supabase.from("ocr_history").insert({
        user_id: userPhone,
        original_image: original.slice(0, 1000), // Store truncated for preview
        translated_image: translated.slice(0, 1000),
        source_language: sourceLang,
        target_language: targetLang,
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
    link.download = `translated_${Date.now()}.png`;
    link.click();
    toast.success("Изображение сохранено");
  };

  const shareImage = async () => {
    if (!translatedImage) return;
    
    try {
      const response = await fetch(translatedImage);
      const blob = await response.blob();
      const file = new File([blob], "translated.png", { type: "image/png" });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Переведенное изображение VAQTA AI"
        });
      } else {
        // Fallback: copy to clipboard
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
    setOcrResult(null);
    setStep("upload");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="AI OCR Переводчик" showBack />

      <main className="px-5 space-y-5 mt-2">
        {/* Premium Badge */}
        {!isPremium && (
          <div className="vaqta-glass p-3 border-[#D4AF37]/30 flex items-center gap-3">
            <Crown className="text-[#D4AF37]" size={20} />
            <div className="flex-1">
              <p className="text-xs font-bold text-[#D4AF37]">Free версия</p>
              <p className="text-[10px] text-[#5C7A6D]">Ограниченное количество переводов</p>
            </div>
            <button className="px-3 py-1.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg text-[10px] font-black uppercase">
              Upgrade
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Upload Step */}
          {step === "upload" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="text-center space-y-2 py-8">
                <div className="w-20 h-20 rounded-[2.5rem] vaqta-gradient flex items-center justify-center mx-auto shadow-2xl vaqta-glow">
                  <Languages size={40} className="text-white" />
                </div>
                <h2 className="text-xl font-black">AI Переводчик фото</h2>
                <p className="text-xs text-[#5C7A6D]">Заменяет текст на фото на переведенный</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="vaqta-glass p-6 border-[#1A3D2E] flex flex-col items-center gap-3 active:scale-95 transition"
                >
                  <Camera className="text-[#00A86B]" size={32} />
                  <span className="text-xs font-black uppercase">Камера</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="vaqta-glass p-6 border-[#1A3D2E] flex flex-col items-center gap-3 active:scale-95 transition"
                >
                  <Upload className="text-[#D4AF37]" size={32} />
                  <span className="text-xs font-black uppercase">Галерея</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
              />

              <div className="vaqta-glass p-4 border-[#1A3D2E] space-y-2">
                <p className="text-[10px] font-black uppercase text-[#5C7A6D]">Поддерживаемые форматы:</p>
                <div className="flex flex-wrap gap-2">
                  {["Документы", "Билеты", "Адреса", "Объявления", "Паспорта"].map((type) => (
                    <span key={type} className="px-2 py-1 bg-white/5 rounded text-[10px] text-[#5C7A6D]">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Language Selection Step */}
          {step === "select" && image && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-[#1A3D2E]">
                <img src={image} alt="Original" className="w-full h-full object-contain bg-[#0C1F1A]" />
                <div className="absolute top-3 left-3 px-3 py-1 bg-[#06140F]/80 backdrop-blur rounded-full text-[10px] font-black uppercase text-[#5C7A6D]">
                  Оригинал
                </div>
              </div>

              <div className="vaqta-glass p-5 border-[#1A3D2E] space-y-4">
                <p className="text-xs font-black uppercase text-[#5C7A6D] text-center">Выберите направление перевода</p>
                
                <div className="flex items-center gap-3">
                  {/* Source Language */}
                  <div className="flex-1 relative">
                    <button
                      onClick={() => setIsLangMenuOpen(true)}
                      className="w-full p-4 bg-[#06140F] border border-[#1A3D2E] rounded-2xl flex items-center gap-3 hover:border-[#00A86B] transition"
                    >
                      <span className="text-2xl">{LANGUAGES.find(l => l.code === sourceLang)?.flag}</span>
                      <div className="text-left">
                        <p className="text-[10px] text-[#5C7A6D] uppercase">С языка</p>
                        <p className="text-sm font-bold">{LANGUAGES.find(l => l.code === sourceLang)?.name}</p>
                      </div>
                      <ChevronDown size={16} className="ml-auto text-[#5C7A6D]" />
                    </button>
                  </div>

                  {/* Swap Button */}
                  <button
                    onClick={swapLanguages}
                    className="p-3 rounded-xl bg-[#00A86B]/10 text-[#00A86B] hover:bg-[#00A86B]/20 transition"
                  >
                    <ArrowRightLeft size={20} />
                  </button>

                  {/* Target Language */}
                  <div className="flex-1 relative">
                    <button
                      onClick={() => setIsLangMenuOpen(true)}
                      className="w-full p-4 bg-[#06140F] border border-[#1A3D2E] rounded-2xl flex items-center gap-3 hover:border-[#00A86B] transition"
                    >
                      <span className="text-2xl">{LANGUAGES.find(l => l.code === targetLang)?.flag}</span>
                      <div className="text-left">
                        <p className="text-[10px] text-[#5C7A6D] uppercase">На язык</p>
                        <p className="text-sm font-bold">{LANGUAGES.find(l => l.code === targetLang)?.name}</p>
                      </div>
                      <ChevronDown size={16} className="ml-auto text-[#5C7A6D]" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={processTranslation}
                  disabled={isProcessing}
                  className="w-full h-14 vaqta-gradient rounded-2xl font-black text-white text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl vaqta-glow active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Languages size={20} />}
                  {isProcessing ? "Обработка..." : "Перевести изображение"}
                </button>

                <button
                  onClick={reset}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl text-[#5C7A6D] text-xs font-black uppercase"
                >
                  Выбрать другое фото
                </button>
              </div>
            </motion.div>
          )}

          {/* Processing Step */}
          {step === "processing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-6"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-[2rem] vaqta-gradient flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={40} />
                </div>
                <div className="absolute inset-0 rounded-[2rem] bg-[#00A86B]/20 animate-pulse blur-xl" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-black text-[#00A86B]">{progress}</p>
                <p className="text-xs text-[#5C7A6D]">AI анализирует и переводит текст...</p>
              </div>
              <div className="w-full max-w-xs h-2 bg-[#1A3D2E] rounded-full overflow-hidden">
                <div className="h-full bg-[#00A86B] animate-pulse w-3/4" />
              </div>
            </motion.div>
          )}

          {/* Result Step */}
          {step === "result" && translatedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Comparison View */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-[#5C7A6D] text-center">Оригинал</p>
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#1A3D2E]">
                    <img src={image!} alt="Original" className="w-full h-full object-contain bg-[#0C1F1A]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-[#00A86B] text-center">Перевод</p>
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#00A86B]/30 shadow-[0_0_30px_rgba(0,168,110,0.1)]">
                    <img src={translatedImage} alt="Translated" className="w-full h-full object-contain bg-[#0C1F1A]" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={downloadImage}
                  className="vaqta-glass p-4 border-[#1A3D2E] flex flex-col items-center gap-2 active:scale-95 transition hover:border-[#00A86B]"
                >
                  <Download className="text-[#00A86B]" size={24} />
                  <span className="text-[10px] font-black uppercase">Скачать</span>
                </button>
                <button
                  onClick={shareImage}
                  className="vaqta-glass p-4 border-[#1A3D2E] flex flex-col items-center gap-2 active:scale-95 transition hover:border-[#00A86B]"
                >
                  <Share2 className="text-[#00A86B]" size={24} />
                  <span className="text-[10px] font-black uppercase">Поделиться</span>
                </button>
                <button
                  onClick={reset}
                  className="vaqta-glass p-4 border-[#1A3D2E] flex flex-col items-center gap-2 active:scale-95 transition hover:border-[#00A86B]"
                >
                  <RefreshCw className="text-[#00A86B]" size={24} />
                  <span className="text-[10px] font-black uppercase">Новый</span>
                </button>
              </div>

              {/* Recognized Text Preview */}
              {ocrResult && (
                <div className="vaqta-glass p-4 border-[#1A3D2E] space-y-2">
                  <p className="text-[10px] font-black uppercase text-[#5C7A6D]">Распознанный текст:</p>
                  <p className="text-xs text-slate-300 line-clamp-3">{ocrResult.text}</p>
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
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-sm vaqta-glass border-[#1A3D2E] rounded-[2rem] p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-black uppercase text-center">Выберите языки</p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-[#5C7A6D] mb-2">С языка:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={`src-${lang.code}`}
                        onClick={() => setSourceLang(lang.code)}
                        className={`p-3 rounded-xl flex items-center gap-2 transition ${
                          sourceLang === lang.code
                            ? "bg-[#00A86B] text-white"
                            : "bg-white/5 text-slate-300"
                        }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-xs font-bold">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase text-[#5C7A6D] mb-2">На язык:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={`tgt-${lang.code}`}
                        onClick={() => setTargetLang(lang.code)}
                        className={`p-3 rounded-xl flex items-center gap-2 transition ${
                          targetLang === lang.code
                            ? "bg-[#00A86B] text-white"
                            : "bg-white/5 text-slate-300"
                        }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-xs font-bold">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsLangMenuOpen(false)}
                className="w-full h-12 vaqta-gradient rounded-2xl font-black text-white text-sm"
              >
                Готово
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}