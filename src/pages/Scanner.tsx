"use client";

import { useState, useRef } from "react";
import { 
  Camera, Image as ImageIcon, Loader2, Download, Copy, 
  Bot, ShieldCheck, RefreshCw, CheckCircle2, ChevronRight,
  FileText, Languages, Share2, Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { imageTranslationService, OCRAnalysis } from "@/services/imageTranslationService";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Scanner() {
  const { t, language } = useLanguage();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ original: string; translated: string; analysis: OCRAnalysis } | null>(null);
  const [view, setView] = useState<"translated" | "original">("translated");
  
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const data = await imageTranslationService.processDocument(file, language);
      setResult(data);
      toast.success(t("scanner.result_ready"));
    } catch (err) {
      toast.error(t("scanner.error_ai"));
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result.translated;
    link.download = `translated_doc_${Date.now()}.jpg`;
    link.click();
  };

  const copyText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.analysis.text);
    toast.success(t("common.done"));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="scanner.title" showBack />
      
      <main className="p-6 space-y-6">
        {!result && !loading ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 gap-8"
          >
            <div className="relative">
               <div className="w-24 h-24 rounded-[2.5rem] vaqta-gradient flex items-center justify-center shadow-2xl vaqta-glow">
                 <Camera size={44} className="text-white" />
               </div>
               <motion.div 
                 animate={{ rotate: 360 }} 
                 transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                 className="absolute -inset-4 border-2 border-dashed border-[#00A86B]/20 rounded-full"
               />
            </div>

            <div className="text-center space-y-2 max-w-xs">
              <h2 className="text-2xl font-black">{t("scanner.title")}</h2>
              <p className="text-xs text-[#5C7A6D] font-bold leading-relaxed">{t("scanner.desc")}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button 
                onClick={() => cameraRef.current?.click()}
                className="h-16 vaqta-gradient rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-white shadow-xl active:scale-95 transition-all"
              >
                <Camera size={20} />
                <span>{t("buttons.take_photo")}</span>
              </button>

              <button 
                onClick={() => fileRef.current?.click()}
                className="h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-[#00A86B] hover:bg-white/10 transition-all"
              >
                <ImageIcon size={20} />
                <span>{t("buttons.gallery")}</span>
              </button>
            </div>

            <input type="file" ref={cameraRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          </motion.div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <Loader2 className="animate-spin text-[#00A86B]" size={48} />
            <div className="text-center">
              <p className="text-[#00A86B] font-black uppercase tracking-[0.2em] animate-pulse">{t("scanner.processing")}</p>
              <p className="text-[10px] text-[#5C7A6D] font-bold mt-2">PADDLE OCR + GEMINI VISION</p>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* View Toggle */}
            <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl">
               <button 
                 onClick={() => setView("translated")}
                 className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${view === 'translated' ? 'bg-[#00A86B] text-white shadow-lg' : 'text-[#5C7A6D]'}`}
               >
                 {t("scanner.translated_img")}
               </button>
               <button 
                 onClick={() => setView("original")}
                 className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${view === 'original' ? 'bg-[#00A86B] text-white shadow-lg' : 'text-[#5C7A6D]'}`}
               >
                 {t("scanner.original")}
               </button>
            </div>

            {/* Main Preview Container */}
            <div className="vaqta-glass overflow-hidden border-[#00A86B]/30 relative aspect-[3/4] sm:aspect-video rounded-[2.5rem] shadow-2xl">
               <img 
                 src={view === 'translated' ? result!.translated : result!.original} 
                 className="w-full h-full object-contain bg-black/40" 
                 alt="Scan" 
               />
               
               <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-3">
                  <button onClick={downloadResult} className="flex-1 h-12 liquid-glass rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-white hover:bg-white/10">
                    <Download size={16} /> {t("scanner.download")}
                  </button>
                  <button onClick={copyText} className="w-12 h-12 liquid-glass rounded-xl flex items-center justify-center text-[#00A86B]">
                    <Copy size={18} />
                  </button>
               </div>
            </div>

            {/* AI Analysis Cards */}
            <div className="space-y-4">
               <div className="vaqta-glass p-6 border-[#1A3D2E] space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-[#00A86B]">
                        <Bot size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">{t("scanner.explanation")}</span>
                     </div>
                     <span className="bg-[#00A86B]/10 text-[#00A86B] px-3 py-1 rounded-full text-[9px] font-black uppercase border border-[#00A86B]/20">
                        {t(`scanner.doc_types.${result?.analysis.docType}`)}
                     </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-slate-200">
                    {result?.analysis.explanation}
                  </p>
               </div>

               {/* Smart Action Buttons */}
               <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => nav(`/ai?q=${encodeURIComponent(t("scanner.ask_ai") + " " + result?.analysis.docType)}`)}
                    className="w-full h-14 liquid-glass rounded-2xl flex items-center justify-between px-6 group"
                  >
                     <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Languages size={18} /></div>
                        <span className="text-xs font-black uppercase tracking-widest">{t("scanner.ask_ai")}</span>
                     </div>
                     <ChevronRight size={18} className="text-[#5C7A6D] group-hover:translate-x-1 transition-transform" />
                  </button>

                  {result?.analysis.docType === 'job_ad' && (
                    <button 
                      onClick={() => nav(`/jobs-test?query=${encodeURIComponent(result.analysis.text)}`)}
                      className="w-full h-14 vaqta-glass border-[#D4AF37]/40 bg-[#D4AF37]/5 rounded-2xl flex items-center justify-between px-6 group"
                    >
                       <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]"><ShieldCheck size={18} /></div>
                          <span className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">{t("scanner.check_employer")}</span>
                       </div>
                       <Search size={18} className="text-[#D4AF37]" />
                    </button>
                  )}
               </div>

               <button 
                 onClick={() => setResult(null)}
                 className="w-full h-16 bg-white/5 border border-white/5 rounded-[2rem] text-slate-500 text-xs font-black uppercase tracking-[0.2em] hover:text-white transition-colors"
               >
                 {t("scanner.new_scan")}
               </button>
            </div>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}