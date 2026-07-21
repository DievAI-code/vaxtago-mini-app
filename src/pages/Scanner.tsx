"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, Loader2, Languages, AlertCircle, X, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/theme";

interface ScanResult {
  ocr_text: string;
  translation: string;
  explanation: string;
  risks: string[];
}

export default function Scanner() {
  const { lang } = useApp();
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (base64: string) => {
    setStatus("processing");
    try {
      const { data, error } = await supabase.functions.invoke("vision-assistant", {
        body: { 
          image: base64,
          language_code: lang,
          request_type: "analyze"
        },
      });

      if (error) throw error;

      setResult({
        ocr_text: data.ocr_text || "",
        translation: data.translation || "",
        explanation: data.explanation || "",
        risks: data.risks || ["Тщательно проверьте паспортные данные", "Срок действия договора может быть ограничен"]
      });
      setStatus("success");
    } catch (err) {
      console.error("Scan Error:", err);
      setStatus("error");
    }
  }, [lang]);

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

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Vision Scanner</h1>
          <p className="text-[#5C7A6D] text-xs font-bold uppercase tracking-widest mt-1">Hujjatlarni aqlli tahlil qilish</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
          <Sparkles size={20} />
        </div>
      </header>

      <main className="px-6">
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <FadeUp key="idle">
              <div className="space-y-6">
                <div 
                  onClick={() => fileRef.current?.click()}
                  className="vaqta-glass p-12 border-dashed border-[#00A86B]/30 flex flex-col items-center justify-center text-center gap-6 cursor-pointer hover:bg-[#00A86B]/5 transition-all group"
                >
                  <div className="w-24 h-24 rounded-full bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B] group-hover:scale-110 transition-transform shadow-2xl">
                    <Camera size={44} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Rasm yoki hujjat</h3>
                    <p className="text-sm text-[#5C7A6D] mt-2 px-4">Skanerlash, tarjima qilish va tushuntirish uchun yuklang</p>
                  </div>
                  <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept="image/*" />
                </div>
              </div>
            </FadeUp>
          )}

          {status === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-center py-12">
              <div className="relative inline-block">
                <Loader2 className="text-[#00A86B] animate-spin" size={64} />
                <div className="absolute inset-0 bg-[#00A86B] blur-3xl opacity-20 animate-pulse" />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.3em] ai-shimmer mt-6 text-[#00D4A8]">AI Tahlil qilmoqda...</p>
            </motion.div>
          )}

          {status === "success" && result && (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
              <div className="vaqta-glass p-6 border-[#00A86B]/20 overflow-hidden">
                <div className="flex items-center gap-2 text-[#00A86B] mb-4">
                  <Languages size={18} />
                  <span className="text-xs font-black uppercase">Tarjima</span>
                </div>
                <p className="text-sm font-medium leading-relaxed">{result.translation}</p>
              </div>

              <div className="vaqta-glass p-6 border-[#D4AF37]/20">
                <div className="flex items-center gap-2 text-[#D4AF37] mb-4">
                  <AlertCircle size={18} />
                  <span className="text-xs font-black uppercase">AI Tushuntirishi</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed italic">{result.explanation}</p>
              </div>

              <div className="space-y-2">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">Xavf va diqqat:</h4>
                 {result.risks.map((risk, i) => (
                   <div key={i} className="glass-card p-4 flex items-start gap-3 border-l-2 border-l-[#D4AF37]">
                     <ShieldAlert size={16} className="text-[#D4AF37] flex-shrink-0" />
                     <span className="text-xs font-bold text-white/80">{risk}</span>
                   </div>
                 ))}
              </div>

              <button 
                onClick={() => setStatus("idle")}
                className="w-full h-16 rounded-3xl vaqta-gradient text-white font-black text-lg shadow-xl"
              >
                Yangi skaner
              </button>
            </motion.div>
          )}

          {status === "error" && (
            <div className="text-center py-12">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <p className="text-white font-bold">Xatolik yuz berdi</p>
              <button onClick={() => setStatus("idle")} className="mt-4 text-[#00A86B] underline font-bold">Qayta urinish</button>
            </div>
          )}
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}