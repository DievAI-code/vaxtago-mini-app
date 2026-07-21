"use client";

import { useState, useRef, useCallback } from "react";
import { 
  Camera, Loader2, ShieldAlert, Copy, Share2, Save, FileSearch, 
  CheckCircle2, Info, RefreshCw, MapPin
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";
import { GoogleMapsButton } from "@/components/GoogleMapsButton";

type ScanStep = 'idle' | 'uploading' | 'ocr' | 'detecting' | 'translating' | 'analyzing' | 'done';

interface ScanResult {
  ocr_text: string;
  translation: string;
  explanation: string;
  risks: string[];
  doc_type: string;
  detected_lang: string;
  address?: string;
  confidence?: string;
}

export default function Scanner() {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<ScanStep>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (base64: string) => {
    setStep('uploading');
    console.log("[Scanner] Starting process...");

    try {
      setStep('ocr');
      const { data, error } = await supabase.functions.invoke("vision-assistant", {
        body: { 
          image: base64,
          language_code: language,
          request_type: "analyze_document"
        },
      });

      if (error) {
        console.error("[Scanner] Supabase Function Error:", error);
        throw new Error("AI_UNAVAILABLE");
      }

      if (!data || (!data.ocr_text && !data.explanation)) {
        console.error("[Scanner] Empty data received:", data);
        throw new Error("OCR_FAILED");
      }

      setStep('analyzing');
      setResult({
        ocr_text: data.ocr_text || "",
        translation: data.translation || "",
        explanation: data.explanation || "",
        risks: data.risks || [],
        doc_type: data.document_type || "Документ",
        detected_lang: data.source_lang || "Авто",
        address: data.address || undefined,
        confidence: data.confidence || "High"
      });
      
      setStep('done');
      toast.success(t('scanner.result_ready'));
    } catch (err: any) {
      console.error("[Scanner] Fatal Error:", err);
      setStep('idle');
      
      if (err.message === "OCR_FAILED") {
        toast.error(t('scanner.error_ocr'));
      } else {
        toast.error(t('scanner.error_ai'));
      }
    }
  }, [language, t]);

  const handleFile = (file: File) => {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error(t('scanner.error_unsupported'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      processImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('common.done'));
  };

  const getStepLabel = () => {
    switch(step) {
      case 'uploading': return t('scanner.step_upload');
      case 'ocr': return t('scanner.step_ocr');
      case 'detecting': return t('scanner.step_lang');
      case 'translating': return t('scanner.step_translate');
      case 'analyzing': return t('scanner.step_analyze');
      default: return t('common.loading');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6 flex items-center justify-between sticky top-0 bg-[#06140F]/80 backdrop-blur-md z-40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("scanner.title")}</h1>
          <p className="text-[#5C7A6D] text-[10px] font-black uppercase tracking-widest mt-1">{t("scanner.desc")}</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
          <FileSearch size={20} />
        </div>
      </header>

      <main className="px-6 flex-1">
        <AnimatePresence mode="wait">
          {step === 'idle' && (
            <FadeUp key="idle">
              <div 
                onClick={() => fileRef.current?.click()}
                className="vaqta-glass p-12 border-dashed border-[#00A86B]/30 flex flex-col items-center justify-center text-center gap-6 cursor-pointer hover:bg-[#00A86B]/5 transition-all active:scale-[0.98]"
              >
                <div className="w-20 h-20 rounded-full bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B] shadow-2xl">
                  <Camera size={36} />
                </div>
                <h3 className="text-lg font-black">{t("scanner.upload_area")}</h3>
                <input 
                  ref={fileRef} 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
                />
              </div>
            </FadeUp>
          )}

          {step !== 'idle' && step !== 'done' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-6">
              <div className="relative inline-block">
                <Loader2 className="text-[#00A86B] animate-spin" size={56} />
                <div className="absolute inset-0 bg-[#00A86B] blur-3xl opacity-20 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#00D4A8] ai-shimmer">
                  {getStepLabel()}
                </p>
              </div>
            </motion.div>
          )}

          {step === 'done' && result && (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
              {/* Header Info */}
              <div className="flex items-center gap-3 bg-[#0C1F1A] border border-[#1A3D2E] p-4 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-[#00A86B] flex items-center justify-center text-white">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#5C7A6D] uppercase tracking-widest">{result.detected_lang} • {result.doc_type}</p>
                  <h3 className="text-lg font-black text-white">{t('scanner.result_ready')}</h3>
                </div>
              </div>

              {/* Google Maps Detected Address Block */}
              {result.address && (
                <div className="vaqta-glass p-6 border-[#00A86B]/30 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-[#00A86B]/10 text-[#00A86B] rounded-xl flex-shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#5C7A6D] uppercase tracking-widest">{t("maps.found_address")}</p>
                      <h4 className="text-base font-bold text-white leading-tight mt-1">{result.address}</h4>
                      <p className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider mt-1">{t("maps.confidence")}: {result.confidence}</p>
                    </div>
                  </div>
                  <GoogleMapsButton address={result.address} />
                </div>
              )}

              {/* Translation */}
              <div className="vaqta-glass p-6 border-[#00A86B]/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase text-[#00A86B]">{t('scanner.translation')}</span>
                  <button onClick={() => copyText(result.translation)} className="p-2 bg-white/5 rounded-xl text-slate-400"><Copy size={14}/></button>
                </div>
                <p className="text-sm font-medium leading-relaxed">{result.translation}</p>
              </div>

              {/* Analysis */}
              <div className="vaqta-glass p-6 border-[#D4AF37]/20">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={16} className="text-[#D4AF37]" />
                  <span className="text-[10px] font-black uppercase text-[#D4AF37]">{t('scanner.explanation')}</span>
                </div>
                <p className="text-sm text-slate-300 italic leading-relaxed">{result.explanation}</p>
              </div>

              {/* Risks */}
              {result.risks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">{t('scanner.risks')}</h4>
                  {result.risks.map((risk, i) => (
                    <div key={i} className="bg-red-500/5 p-4 rounded-2xl border border-red-500/20 flex items-start gap-3">
                      <ShieldAlert size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs font-bold text-red-100/80">{risk}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setStep('idle')}
                  className="w-full h-16 rounded-3xl vaqta-gradient text-white font-black text-lg shadow-xl"
                >
                  <RefreshCw className="inline-block mr-2" size={20} />
                  {t("scanner.new_scan")}
                </button>
                <div className="grid grid-cols-2 gap-3">
                   <button className="h-14 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold flex items-center justify-center gap-2"><Share2 size={16}/> {t('common.share')}</button>
                   <button className="h-14 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold flex items-center justify-center gap-2"><Save size={16}/> {t('common.save')}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}