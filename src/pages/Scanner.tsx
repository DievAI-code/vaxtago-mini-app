"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, Loader2, Languages, AlertCircle, X, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";
import { motion, AnimatePresence } from "framer-motion";

interface ScanResult {
  ocr: string;
  translation: string;
  explanation: string;
  risks: string[];
}

export default function Scanner() {
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    processImage();
  };

  const processImage = useCallback(async () => {
    setStatus("processing");
    // Симуляция AI-движка
    await new Promise(r => setTimeout(r, 3500));
    setResult({
      ocr: "Трудовой договор №452. Работодатель: ООО 'ТрансЛогистик'. Оклад: 110,000 руб. Срок: 12 месяцев.",
      translation: "452-sonli mehnat shartnomasi. Ish beruvchi: 'TransLogistik' MCHJ. Ish haqi: 110,000 rubl. Muddat: 12 oy.",
      explanation: "Bu logistika sohasidagi standart mehnat shartnomasi. Maosh va ish vaqti qonuniy ko'rsatilgan.",
      risks: ["3-band: Kechikish uchun jarima bor", "5-band: Sug'urta haqida ma'lumot kam"]
    });
    setStatus("success");
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Skaner</h1>
          <p className="text-[#5C7A6D] text-xs font-bold uppercase tracking-widest mt-1">Hujjatlarni tahlil qilish</p>
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
                    <h3 className="text-xl font-black">Rasm yuklash</h3>
                    <p className="text-sm text-[#5C7A6D] mt-2 px-4">Hujjat, shartnoma yoki e'lon rasmini yuboring. AI hammasini tushuntiradi.</p>
                  </div>
                  <div className="flex gap-2">
                    {["RU", "UZ", "EN", "TJ", "KG"].map(l => (
                      <span key={l} className="text-[9px] font-black bg-white/5 px-2 py-1 rounded border border-white/10">{l}</span>
                    ))}
                  </div>
                  <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept="image/*" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-5 flex flex-col items-center text-center gap-3">
                    <FileText className="text-[#00A86B]" />
                    <span className="text-xs font-bold">Hujjat</span>
                  </div>
                  <div className="glass-card p-5 flex flex-col items-center text-center gap-3">
                    <Languages className="text-[#D4AF37]" />
                    <span className="text-xs font-bold">Tarjima</span>
                  </div>
                </div>
              </div>
            </FadeUp>
          )}

          {status === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="vaqta-glass overflow-hidden h-64 relative">
                {image && <img src={image} className="w-full h-full object-cover opacity-40 blur-sm" alt="scanning" />}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <Loader2 className="text-[#00A86B] animate-spin" size={48} />
                    <div className="absolute inset-0 bg-[#00A86B] blur-2xl opacity-20 animate-pulse" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-[0.3em] ai-shimmer">AI tahlil qilmoqda...</p>
                  <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ x: "-100%" }} 
                      animate={{ x: "100%" }} 
                      transition={{ repeat: Infinity, duration: 1.5 }} 
                      className="w-full h-full bg-[#00A86B]" 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {status === "success" && result && (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
              <div className="relative vaqta-glass overflow-hidden h-40">
                <img src={image || ''} className="w-full h-full object-cover opacity-60" alt="preview" />
                <button onClick={() => setStatus("idle")} className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full"><X size={16}/></button>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-[#00A86B] px-3 py-1 rounded-lg">
                  <CheckCircle2 size={14} />
                  <span className="text-[10px] font-black uppercase">Tahlil tayyor</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="vaqta-glass p-6 space-y-4 border-[#00A86B]/20 relative overflow-hidden">
                  <div className="flex items-center gap-2 text-[#00A86B]">
                    <Languages size={18} />
                    <span className="text-xs font-black uppercase tracking-wider">O'zbekcha tarjima</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-white/90">{result.translation}</p>
                </div>

                <div className="vaqta-glass p-6 space-y-4 border-[#D4AF37]/20">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <AlertCircle size={18} />
                    <span className="text-xs font-black uppercase tracking-wider">AI tushuntirishi</span>
                  </div>
                  <p className="text-sm text-[#5C7A6D] leading-relaxed italic font-medium">"{result.explanation}"</p>
                </div>

                <div className="space-y-2">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">Diqqat qiling:</h4>
                   {result.risks.map((risk, i) => (
                     <div key={i} className="glass-card p-4 flex items-start gap-3 border-l-2 border-l-[#D4AF37]">
                       <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                       <span className="text-xs font-bold text-white/80">{risk}</span>
                     </div>
                   ))}
                </div>
              </div>

              <button 
                onClick={() => setStatus("idle")}
                className="w-full h-16 rounded-3xl vaqta-gradient text-white font-black text-lg shadow-xl shadow-[#00A86B]/10"
              >
                Yangi skaner
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}