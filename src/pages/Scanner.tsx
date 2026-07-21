"use client";

import { useState, useRef, useCallback } from "react";
import { 
  Camera, Loader2, Languages, AlertCircle, Sparkles, 
  ShieldAlert, Copy, Share2, Save, ArrowRightLeft, FileSearch, 
  CheckCircle2, AlertTriangle, Info
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";

interface ScanResult {
  ocr_text: string;
  translation: string;
  explanation: string;
  risks: string[];
  doc_type: string;
  recommendations: string[];
  important_points: string[];
  source_lang_detected: string;
}

const SUPPORTED_SOURCE_LANGS = [
  { id: 'auto', label: 'scanner.auto_detect' },
  { id: 'ru', label: '🇷🇺 Русский' },
  { id: 'uz', label: '🇺🇿 O\'zbekcha' },
  { id: 'tg', label: '🇹🇯 Тоҷикӣ' },
  { id: 'en', label: '🇬🇧 English' },
];

const TARGET_LANGS = [
  { id: 'ru', label: '🇷🇺' },
  { id: 'uz', label: '🇺🇿' },
  { id: 'tg', label: '🇹🇯' },
];

export default function Scanner() {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState(language);
  const fileRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (base64: string) => {
    setStatus("processing");
    try {
      const { data, error } = await supabase.functions.invoke("vision-assistant", {
        body: { 
          image: base64,
          language_code: targetLang,
          source_language: sourceLang === 'auto' ? undefined : sourceLang,
          request_type: "analyze_document"
        },
      });

      if (error) throw error;

      setResult({
        ocr_text: data.ocr_text || "",
        translation: data.translation || "",
        explanation: data.explanation || "",
        risks: data.risks || [],
        doc_type: data.document_type || "Unknown",
        recommendations: data.recommendations || [],
        important_points: data.important_points || [],
        source_lang_detected: data.source_lang || "Detected"
      });
      setStatus("success");
    } catch (err) {
      console.error("Scan Error:", err);
      setStatus("error");
      toast.error(t('common.error'));
    }
  }, [targetLang, sourceLang, t]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setImage(base64);
      processImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('common.done'));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32 safe-bottom">
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
          {status === "idle" && (
            <FadeUp key="idle">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#5C7A6D] uppercase ml-2">{t('scanner.source_lang')}</label>
                    <select 
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      className="w-full bg-[#0C1F1A] border border-[#1A3D2E] rounded-xl py-3 px-4 text-xs font-bold focus:border-[#00A86B] outline-none"
                    >
                      {SUPPORTED_SOURCE_LANGS.map(l => (
                        <option key={l.id} value={l.id}>{l.id === 'auto' ? t(l.label) : l.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#5C7A6D] uppercase ml-2">{t('scanner.target_lang')}</label>
                    <div className="flex gap-2 bg-[#0C1F1A] border border-[#1A3D2E] rounded-xl p-1">
                      {TARGET_LANGS.map(l => (
                        <button 
                          key={l.id}
                          onClick={() => setTargetLang(l.id as any)}
                          className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${targetLang === l.id ? 'bg-[#00A86B] text-white shadow-lg' : 'text-[#5C7A6D]'}`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => fileRef.current?.click()}
                  className="vaqta-glass p-12 border-dashed border-[#00A86B]/30 flex flex-col items-center justify-center text-center gap-6 cursor-pointer hover:bg-[#00A86B]/5 transition-all group active:scale-[0.98]"
                >
                  <div className="w-20 h-20 rounded-full bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B] group-hover:scale-110 transition-transform shadow-2xl">
                    <Camera size={36} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black">{t("scanner.upload_area")}</h3>
                  </div>
                  <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept="image/*" />
                </div>
              </div>
            </FadeUp>
          )}

          {status === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-center py-20">
              <div className="relative inline-block">
                <Loader2 className="text-[#00A86B] animate-spin" size={56} />
                <div className="absolute inset-0 bg-[#00A86B] blur-3xl opacity-20 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-[0.3em] ai-shimmer text-[#00D4A8]">{t("scanner.processing")}</p>
                <p className="text-[10px] text-[#5C7A6D] font-bold uppercase">{t('scanner.detecting_lang')}</p>
              </div>
            </motion.div>
          )}

          {status === "success" && result && (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
              {/* Doc Type Header */}
              <div className="flex items-center gap-3 bg-[#0C1F1A] border border-[#1A3D2E] p-4 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-[#00A86B] flex items-center justify-center text-white shadow-lg">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#5C7A6D] uppercase tracking-widest">{t('scanner.doc_type')}</p>
                  <h3 className="text-lg font-black text-white">{result.doc_type}</h3>
                </div>
              </div>

              {/* Translation Card */}
              <div className="vaqta-glass p-6 border-[#00A86B]/20 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[#00A86B]">
                    <Languages size={18} />
                    <span className="text-[10px] font-black uppercase">{t("scanner.translation")}</span>
                  </div>
                  <button onClick={() => copyToClipboard(result.translation)} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white"><Copy size={16}/></button>
                </div>
                <p className="text-sm font-medium leading-relaxed text-white/90">{result.translation}</p>
              </div>

              {/* AI Analysis Grid */}
              <div className="grid grid-cols-1 gap-4">
                 <div className="vaqta-glass p-6 border-[#D4AF37]/20">
                    <div className="flex items-center gap-2 text-[#D4AF37] mb-3">
                      <Info size={18} />
                      <span className="text-[10px] font-black uppercase">{t("scanner.explanation")}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed italic">{result.explanation}</p>
                 </div>

                 {result.risks.length > 0 && (
                   <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">{t("scanner.risks")}</h4>
                      {result.risks.map((risk, i) => (
                        <div key={i} className="bg-red-500/5 p-4 rounded-[1.5rem] border border-red-500/20 flex items-start gap-3">
                          <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-xs font-bold text-red-100/80 leading-relaxed">{risk}</span>
                        </div>
                      ))}
                   </div>
                 )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setStatus("idle")}
                  className="w-full h-16 rounded-3xl vaqta-gradient text-white font-black text-lg shadow-xl vaqta-glow"
                >
                  {t("scanner.new_scan")}
                </button>
                <div className="grid grid-cols-2 gap-3">
                   <button className="h-14 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold flex items-center justify-center gap-2"><Share2 size={16}/> {t('common.share')}</button>
                   <button className="h-14 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold flex items-center justify-center gap-2"><Save size={16}/> {t('common.save')}</button>
                </div>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <div className="text-center py-20">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <p className="text-white font-black">{t("common.error")}</p>
              <button onClick={() => setStatus("idle")} className="mt-4 px-8 py-3 bg-[#00A86B] rounded-2xl text-white font-black uppercase text-xs tracking-widest">{t("common.retry")}</button>
            </div>
          )}
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}