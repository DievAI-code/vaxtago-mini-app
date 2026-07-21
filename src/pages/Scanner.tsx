"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Loader2, CheckCircle, FileText, Languages, AlertCircle, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";
import { Button } from "@/components/ui/button";

export default function Scanner() {
  const [status, setStatus] = useState("idle");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
    processImage();
  };

  const processImage = async () => {
    setStatus("processing");
    // Имитация AI обработки
    setTimeout(() => {
      setResult({
        ocr: "Трудовой договор №452 от 12.02.2025. Работодатель: ООО 'Вектор'. Оклад: 85,000 руб.",
        translation: "12.02.2025 yildagi 452-sonli mehnat shartnomasi. Ish beruvchi: 'Vektor' MCHJ. Ish haqi: 85,000 rubl.",
        explanation: "Bu standart mehnat shartnomasi. Ish haqi miqdori va muddatlariga e'tibor bering. Hech qanday shubhali holat topilmadi."
      });
      setStatus("success");
    }, 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6">
        <h1 className="text-2xl font-bold tracking-tight">AI Skaner</h1>
        <p className="text-[#5C7A6D] text-sm">Hujjatlarni AI orqali tahlil qilish</p>
      </header>

      <main className="px-6 space-y-6">
        {status === "idle" && (
          <FadeUp>
            <div 
              onClick={() => fileRef.current?.click()}
              className="vaqta-glass p-12 border-dashed border-[#00A86B]/30 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:bg-[#00A86B]/5 transition-colors"
            >
              <div className="w-20 h-20 rounded-full bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
                <Camera size={40} />
              </div>
              <div>
                <p className="text-lg font-bold">Rasm yuklash</p>
                <p className="text-sm text-[#5C7A6D]">Foto, skrinshot yoki PDF</p>
              </div>
              <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept="image/*" />
            </div>
          </FadeUp>
        )}

        {status === "processing" && (
          <div className="space-y-6">
            <div className="vaqta-glass overflow-hidden h-48 relative">
              {image && <img src={image} className="w-full h-full object-cover blur-sm" />}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                <Loader2 className="text-[#00A86B] animate-spin mb-2" size={32} />
                <p className="text-xs font-black uppercase tracking-widest ai-shimmer">AI tahlil qilmoqda...</p>
              </div>
            </div>
          </div>
        )}

        {status === "success" && result && (
          <div className="space-y-4">
            <div className="relative vaqta-glass overflow-hidden h-40">
              <img src={image} className="w-full h-full object-cover" />
              <button onClick={() => setStatus("idle")} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full"><X size={16}/></button>
            </div>

            <FadeUp>
              <div className="space-y-4">
                <div className="vaqta-glass p-6 border-[#00A86B]/20">
                  <div className="flex items-center gap-2 text-[#00A86B] mb-3">
                    <Languages size={18} />
                    <span className="text-xs font-black uppercase tracking-wider">O'zbekcha tarjima</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{result.translation}</p>
                </div>

                <div className="vaqta-glass p-6 border-[#D4AF37]/20">
                  <div className="flex items-center gap-2 text-[#D4AF37] mb-3">
                    <AlertCircle size={18} />
                    <span className="text-xs font-black uppercase tracking-wider">AI tushuntirishi</span>
                  </div>
                  <p className="text-sm text-[#5C7A6D] leading-relaxed italic">"{result.explanation}"</p>
                </div>
              </div>
            </FadeUp>

            <Button className="w-full h-14 rounded-3xl vaqta-gradient text-white font-bold" onClick={() => setStatus("idle")}>
              Yangi skaner
            </Button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}