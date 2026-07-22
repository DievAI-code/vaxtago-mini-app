"use client";

import { useState, useRef, useCallback } from "react";
import { 
  Camera, Loader2, ShieldAlert, Copy, Share2, Save, FileSearch, 
  CheckCircle2, Info, RefreshCw, MapPin, Globe
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";
import { MapView } from "@/components/MapView";
import { geocodingService } from "@/services/geocodingService";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";

type ScanStep = 'idle' | 'uploading' | 'ocr' | 'analyzing' | 'done';

const TARGET_LANGS = [
  { code: "uz", label: "O'zbekcha", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "tg", label: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

interface ScanResult {
  ocr_text: string;
  translation: string;
  explanation: string;
  risks: string[];
  doc_type: string;
  detected_lang: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export default function Scanner() {
  const { t, language } = useLanguage();
  const [targetLang, setTargetLang] = useState<string>(language || "uz");
  const [step, setStep] = useState<ScanStep>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (base64: string) => {
    setStep('uploading');

    try {
      setStep('ocr');
      const { data, error } = await supabase.functions.invoke("vision-assistant", {
        body: { 
          image: base64,
          language_code: targetLang,
          request_type: "analyze_document"
        },
      });

      if (error || !data) {
        throw new Error("AI_UNAVAILABLE");
      }

      setStep('analyzing');
      
      const potentialAddr = data.address || null;
      let lat: number | undefined;
      let lng: number | undefined;

      if (potentialAddr) {
        const coordsList = await geocodingService.searchAddress(potentialAddr);
        if (coordsList.length > 0) {
          lat = coordsList[0].latitude;
          lng = coordsList[0].longitude;
        }
      }

      const resObj: ScanResult = {
        ocr_text: data.ocr_text || "",
        translation: data.translation || data.ocr_text || "",
        explanation: data.explanation || "Документ проанализирован.",
        risks: data.risks || ["Проверьте личные данные и сроки действия."],
        doc_type: data.document_type || "Документ",
        detected_lang: data.source_lang || "Авто",
        address: potentialAddr || undefined,
        lat,
        lng
      };

      setResult(resObj);
      setStep('done');

      // Сохраняем скан в localStorage историю
      try {
        const existing = JSON.parse(localStorage.getItem("vaqta_doc_history") || "[]");
        const updated = [{ id: Date.now(), doc_type: resObj.doc_type, summary: resObj.explanation, date: new Date().toISOString() }, ...existing].slice(0, 10);
        localStorage.setItem("vaqta_doc_history", JSON.stringify(updated));
      } catch {}

      toast.success(t('scanner.result_ready'));
    } catch (err: any) {
      console.error("[Scanner Error]:", err);
      setStep('idle');
      toast.error(t('scanner.error_ai'));
    }
  }, [targetLang, t]);

  const handleFile = (file: File) => {
    if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type)) {
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

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <Header title="scanner.title" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="px-6 flex-1 space-y-6 mt-4">
        {/* Language selector for translation */}
        <div className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#5C7A6D]">
            <Globe size={16} className="text-[#00A86B]" />
            <span>Перевести на:</span>
          </div>
          <div className="flex gap-1.5">
            {TARGET_LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => setTargetLang(l.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  targetLang === l.code 
                    ? "bg-[#00A86B] border-[#00A86B] text-white" 
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}
              >
                <span>{l.flag}</span>
              </button>
            ))}
          </div>
        </div>

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
                <div>
                  <h3 className="text-lg font-black text-white">{t("scanner.upload_area")}</h3>
                  <p className="text-xs text-[#5C7A6D] mt-1">Поддерживаются фото, договоры, патенты, паспорта</p>
                </div>
                <input 
                  ref={fileRef} 
                  type="file" 
                  className="hidden" 
                  accept="image/*,application/pdf" 
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
                  {step === 'uploading' ? 'Загрузка файла...' : step === 'ocr' ? 'Распознавание текста...' : 'Анализ рисков и перевод AI...'}
                </p>
              </div>
            </motion.div>
          )}

          {step === 'done' && result && (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
              <div className="flex items-center gap-3 bg-[#0C1F1A] border border-[#1A3D2E] p-4 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-[#00A86B] flex items-center justify-center text-white">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#5C7A6D] uppercase tracking-widest">{result.detected_lang} • {result.doc_type}</p>
                  <h3 className="text-lg font-black text-white">{t('scanner.result_ready')}</h3>
                </div>
              </div>

              {result.address && (
                <div className="vaqta-glass p-5 border-[#00A86B]/30 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-[#00A86B]/10 text-[#00A86B] rounded-xl flex-shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[#5C7A6D] uppercase tracking-widest">{t("maps.found_address")}</p>
                      <h4 className="text-sm font-bold text-white leading-snug mt-0.5">{result.address}</h4>
                    </div>
                  </div>
                  {result.lat && result.lng && (
                    <MapView latitude={result.lat} longitude={result.lng} address={result.address} />
                  )}
                </div>
              )}

              <div className="vaqta-glass p-6 border-[#00A86B]/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase text-[#00A86B]">{t('scanner.translation')}</span>
                  <button onClick={() => copyText(result.translation)} className="p-2 bg-white/5 rounded-xl text-slate-400"><Copy size={14}/></button>
                </div>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{result.translation}</p>
              </div>

              <div className="vaqta-glass p-6 border-[#D4AF37]/20">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={16} className="text-[#D4AF37]" />
                  <span className="text-[10px] font-black uppercase text-[#D4AF37]">{t('scanner.explanation')}</span>
                </div>
                <p className="text-sm text-slate-300 italic leading-relaxed">{result.explanation}</p>
              </div>

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

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setStep('idle')}
                  className="w-full h-16 rounded-3xl vaqta-gradient text-white font-black text-lg shadow-xl flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  {t("scanner.new_scan")}
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