OCR -> Lang Select -> Translate -> Result Tabs">
"use client";

import { useState, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Image as ImageIcon, Loader2, Download, Copy, 
  Languages, Check, X, FileText, Sparkles, MapPin, Phone, Globe,
  ArrowRightLeft, Volume2, Share2, RefreshCw
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { ocrService, OCRResult } from "@/services/ocr/ocrService";
import { translationService, LanguageCode } from "@/services/ocr/translationService";
import { imageTranslator } from "@/services/ocr/imageTranslator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = "upload" | "processing_ocr" | "select_lang" | "processing_trans" | "result";
type ViewMode = "translated" | "text" | "compare";

const LANGS = [
  { code: "ru" as LanguageCode, label: "Русский", flag: "🇷🇺" },
  { code: "uz_lat" as LanguageCode, label: "O'zbek (Lotin)", flag: "🇺🇿" },
  { code: "uz_cyr" as LanguageCode, label: "Ўзбек (Кирилл)", flag: "🇺🇿" },
  { code: "en" as LanguageCode, label: "English", flag: "🇬🇧" },
];

export default function Scanner() {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("upload");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [translatedImage, setTranslatedImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [translatedText, setTranslatedText] = useState<string>("");
  const [targetLang, setTargetLang] = useState<LanguageCode>(() => (localStorage.getItem("scanner_target_lang") as LanguageCode) || "uz_lat");
  const [viewMode, setViewMode] = useState<ViewMode>("translated");
  const [sliderPos, setSliderPos] = useState(50);
  const [docType, setDocType] = useState<string>("other");
  
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);

  const handleImageSelect = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setOriginalImage(dataUrl);
      setStep("processing_ocr");
      
      try {
        const result = await ocrService.recognizeText(dataUrl, "auto");
        setOcrResult(result);
        setDocType(guessDocType(result.text));
        setStep("select_lang");
      } catch (err) {
        toast.error(t("scanner.error_ocr"));
        setStep("upload");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTranslate = async () => {
    if (!originalImage || !ocrResult) return;
    setStep("processing_trans");
    
    try {
      const translations = new Map<number, string>();
      let fullTranslatedText = "";
      
      for (let i = 0; i < ocrResult.blocks.length; i++) {
        const block = ocrResult.blocks[i];
        if (block.text.trim()) {
          const result = await translationService.translate(block.text, ocrResult.language, targetLang);
          translations.set(i, result.translatedText);
          fullTranslatedText += result.translatedText + "\n";
        }
      }
      
      setTranslatedText(fullTranslatedText);
      
      const newImage = await imageTranslator.createTranslatedImage({
        image: originalImage,
        blocks: ocrResult.blocks,
        translations,
      });
      setTranslatedImage(newImage);
      setStep("result");
      
      // Save to history
      try {
        const userPhone = localStorage.getItem("vaxtago_user_phone");
        if (userPhone) {
          await supabase.from("ocr_history").insert({
            user_id: userPhone,
            original_image: originalImage.slice(0, 500),
            translated_image: newImage.slice(0, 500),
            source_language: ocrResult.language,
            target_language: targetLang,
            recognized_text: ocrResult.text.slice(0, 1000),
            created_at: new Date().toISOString(),
          });
        }
      } catch {}
      
    } catch (err) {
      toast.error(t("scanner.error_translate"));
      setStep("select_lang");
    }
  };

  const guessDocType = (text: string): string => {
    const low = text.toLowerCase();
    if (/вакансия|зарплат|работа|график/i.test(low)) return "vacancy";
    if (/паспорт|серия|номер|выдан/i.test(low)) return "passport";
    if (/договор|контракт|стороны|обязан/i.test(low)) return "contract";
    if (/ул\.|улица|дом|квартира|адрес/i.test(low)) return "address";
    if (/чек|итого|сумма|товар/i.test(low)) return "receipt";
    return "other";
  };

  const downloadImage = (format: "jpeg" | "png") => {
    if (!translatedImage) return;
    const link = document.createElement("a");
    link.href = translatedImage;
    link.download = `vaqta-translated-${Date.now()}.${format}`;
    link.click();
  };

  const handleSliderMove = (clientX: number) => {
    if (!compareRef.current) return;
    const rect = compareRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const reset = () => {
    setOriginalImage(null);
    setTranslatedImage(null);
    setOcrResult(null);
    setTranslatedText("");
    setStep("upload");
  };

  const selectLang = (lang: LanguageCode) => {
    setTargetLang(lang);
    localStorage.setItem("scanner_target_lang", lang);
  };

  // Smart actions parsing
  const phones = ocrResult?.text.match(/(\+?\d[\d\s\-()]{7,}\d)/g) || [];
  const urls = ocrResult?.text.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi) || [];
  const hasAddress = docType === "address" || /ул\.|улица|дом/i.test(ocrResult?.text || "");

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="scanner.title" showBack />
      
      <main className="px-5 space-y-5 mt-2 flex-1">
        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
              <div className="text-center space-y-3 py-12">
                <div className="w-24 h-24 rounded-[2.5rem] vaqta-gradient flex items-center justify-center mx-auto shadow-2xl vaqta-glow">
                  <Camera size={44} className="text-white" />
                </div>
                <h2 className="text-2xl font-black">{t("scanner.title")}</h2>
                <p className="text-xs text-[#5C7A6D] max-w-xs mx-auto">{t("scanner.desc")}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => cameraRef.current?.click()} className="vaqta-glass p-6 border-[#1A3D2E] flex flex-col items-center gap-3 active:scale-95 transition hover:border-[#0AA86E]">
                  <Camera className="text-[#0AA86E]" size={32} />
                  <span className="text-xs font-black uppercase">{t("scanner.upload_camera")}</span>
                </button>
                <button onClick={() => fileRef.current?.click()} className="vaqta-glass p-6 border-[#1A3D2E] flex flex-col items-center gap-3 active:scale-95 transition hover:border-[#D4AF37]">
                  <ImageIcon className="text-[#D4AF37]" size={32} />
                  <span className="text-xs font-black uppercase">{t("scanner.upload_gallery")}</span>
                </button>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />
            </motion.div>
          )}

          {step === "processing_ocr" && (
            <motion.div key="proc_ocr" className="flex flex-col items-center justify-center py-24 space-y-6">
              <Loader2 className="animate-spin text-[#0AA86E]" size={48} />
              <p className="text-base font-black text-[#0AA86E] uppercase tracking-[0.2em] animate-pulse">{t("scanner.step_ocr")}</p>
            </motion.div>
          )}

          {step === "select_lang" && originalImage && (
            <motion.div key="select_lang" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-[#1A3D2E] shadow-2xl">
                <img src={originalImage} alt="Original" className="w-full h-full object-contain bg-[#0C1F1A]" />
              </div>
              
              <div className="vaqta-glass p-6 border-[#1A3D2E] space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white text-center">{t("scanner.select_lang_title")}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {LANGS.map((l) => (
                    <button 
                      key={l.code} 
                      onClick={() => selectLang(l.code)}
                      className={`p-4 rounded-2xl flex items-center gap-2 transition-all ${
                        targetLang === l.code ? "bg-[#0AA86E] text-white shadow-lg vaqta-glow" : "bg-[#06140F] border border-[#1A3D2E] text-slate-300"
                      }`}
                    >
                      <span className="text-2xl">{l.flag}</span>
                      <span className="text-xs font-bold text-left">{l.label}</span>
                      {targetLang === l.code && <Check size={16} className="ml-auto" />}
                    </button>
                  ))}
                </div>
                <button onClick={handleTranslate} className="w-full h-14 vaqta-gradient rounded-2xl font-black text-white text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform">
                  <Languages size={20} /> {t("common.translate")}
                </button>
              </div>
            </motion.div>
          )}

          {step === "processing_trans" && (
            <motion.div key="proc_trans" className="flex flex-col items-center justify-center py-24 space-y-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-[2rem] vaqta-gradient flex items-center justify-center shadow-2xl">
                  <Loader2 className="animate-spin text-white" size={48} />
                </div>
                <div className="absolute inset-0 rounded-[2rem] bg-[#0AA86E]/20 animate-pulse blur-xl" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-base font-black text-[#0AA86E]">{t("scanner.step_translate")}</p>
                <p className="text-xs text-[#5C7A6D] uppercase tracking-widest font-bold">{t("scanner.step_render")}</p>
              </div>
            </motion.div>
          )}

          {step === "result" && translatedImage && (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Doc Type Badge */}
              <div className="flex justify-between items-center">
                <span className="bg-[#0AA86E]/10 text-[#0AA86E] border border-[#0AA86E]/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  {t(`scanner.doc_${docType}`)}
                </span>
                <button onClick={reset} className="text-[10px] font-black uppercase text-[#5C7A6D] hover:text-white transition">{t("scanner.retry")}</button>
              </div>

              {/* View Mode Tabs */}
              <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl">
                <button onClick={() => setViewMode("translated")} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'translated' ? 'bg-[#0AA86E] text-white shadow-lg' : 'text-[#5C7A6D]'}`}>{t("scanner.tab_translated")}</button>
                <button onClick={() => setViewMode("text")} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'text' ? 'bg-[#0AA86E] text-white shadow-lg' : 'text-[#5C7A6D]'}`}>{t("scanner.tab_text")}</button>
                <button onClick={() => setViewMode("compare")} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'compare' ? 'bg-[#0AA86E] text-white shadow-lg' : 'text-[#5C7A6D]'}`}>{t("scanner.tab_compare")}</button>
              </div>

              {/* View Content */}
              {viewMode === "translated" && (
                <div className="aspect-[3/4] rounded-[2rem] overflow-hidden border border-[#0AA86E]/30 shadow-2xl">
                  <img src={translatedImage} alt="Translated" className="w-full h-full object-contain bg-[#0C1F1A]" />
                </div>
              )}

              {viewMode === "text" && (
                <div className="space-y-4">
                  <div className="vaqta-glass p-4 border-[#1A3D2E]">
                    <p className="text-[10px] font-black uppercase text-[#5C7A6D] mb-2">{t("scanner.original_text")}</p>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{ocrResult?.text}</p>
                  </div>
                  <div className="vaqta-glass p-4 border-[#0AA86E]/30">
                    <p className="text-[10px] font-black uppercase text-[#0AA86E] mb-2">{t("scanner.translated_text")}</p>
                    <p className="text-sm text-white whitespace-pre-wrap">{translatedText}</p>
                  </div>
                </div>
              )}

              {viewMode === "compare" && (
                <div ref={compareRef} className="relative aspect-[3/4] rounded-[2rem] overflow-hidden border border-[#1A3D2E] shadow-lg select-none"
                  onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e.clientX)}
                  onMouseDown={(e) => handleSliderMove(e.clientX)}
                  onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
                  onTouchStart={(e) => handleSliderMove(e.touches[0].clientX)}
                >
                  <img src={originalImage!} alt="Original" className="absolute inset-0 w-full h-full object-contain bg-[#0C1F1A]" draggable={false} />
                  <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
                    <img src={translatedImage} alt="Translated" className="w-full h-full object-contain bg-[#0C1F1A]" draggable={false} />
                  </div>
                  <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)] pointer-events-none" style={{ left: `${sliderPos}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-2xl flex items-center justify-center pointer-events-none" style={{ left: `calc(${sliderPos}% - 20px)` }}>
                    <ArrowRightLeft className="text-black" size={16} />
                  </div>
                </div>
              )}

              {/* Smart Actions */}
              <div className="grid grid-cols-3 gap-2">
                {hasAddress && (
                  <button className="vaqta-glass p-3 flex flex-col items-center gap-1 active:scale-95 transition">
                    <MapPin size={18} className="text-[#0AA86E]" />
                    <span className="text-[9px] font-black uppercase">{t("scanner.action_route")}</span>
                  </button>
                )}
                {phones.length > 0 && (
                  <a href={`tel:${phones[0]}`} className="vaqta-glass p-3 flex flex-col items-center gap-1 active:scale-95 transition">
                    <Phone size={18} className="text-blue-400" />
                    <span className="text-[9px] font-black uppercase">{t("scanner.action_call")}</span>
                  </a>
                )}
                {urls.length > 0 && (
                  <a href={urls[0].startsWith("http") ? urls[0] : `https://${urls[0]}`} target="_blank" rel="noreferrer" className="vaqta-glass p-3 flex flex-col items-center gap-1 active:scale-95 transition">
                    <Globe size={18} className="text-purple-400" />
                    <span className="text-[9px] font-black uppercase">{t("scanner.action_website")}</span>
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => downloadImage("jpeg")} className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-center gap-2 active:scale-95 transition">
                  <Download size={18} className="text-[#0AA86E]" />
                  <span className="text-xs font-black uppercase">{t("scanner.save_jpg")}</span>
                </button>
                <button onClick={() => downloadImage("png")} className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-center gap-2 active:scale-95 transition">
                  <Download size={18} className="text-[#D4AF37]" />
                  <span className="text-xs font-black uppercase">{t("scanner.save_png")}</span>
                </button>
                <button onClick={() => navigator.clipboard.writeText(translatedText)} className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-center gap-2 active:scale-95 transition">
                  <Copy size={18} className="text-blue-400" />
                  <span className="text-xs font-black uppercase">{t("scanner.copy")}</span>
                </button>
                <button className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-center gap-2 active:scale-95 transition">
                  <Sparkles size={18} className="text-purple-400" />
                  <span className="text-xs font-black uppercase">{t("scanner.ai_analysis")}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}