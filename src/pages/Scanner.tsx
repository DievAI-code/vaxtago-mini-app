"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Loader2, Sparkles, Check, ChevronRight, Download } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { imageTranslationService } from "@/services/imageTranslationService";
import { subscriptionService } from "@/services/subscriptionService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Scanner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (file: File) => {
    const canUse = await subscriptionService.canUseFeature("vision");
    if (!canUse) {
      toast.error("Лимит исчерпан. Перейдите на Premium!");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const data = await imageTranslationService.translateImage(base64, "uz");
        setResult(data);
        toast.success("Перевод готов!");
      } catch (err) {
        toast.error("Ошибка AI Vision");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="AI Vision" showBack />
      
      <main className="p-6 space-y-8">
        {!result ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="w-24 h-24 rounded-full vaqta-gradient flex items-center justify-center vaqta-glow">
              <Camera size={40} />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black">Перевод по фото</h2>
              <p className="text-sm text-[#5C7A6D]">Загрузите документ или скриншот</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              id="cam-input" 
              accept="image/*" 
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <label 
              htmlFor="cam-input"
              className="w-full h-16 bg-[#00A86B] rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest cursor-pointer shadow-lg"
            >
              Сфотографировать <ChevronRight size={20} />
            </label>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="vaqta-glass p-6 border-[#00A86B]/30">
                <h3 className="text-[10px] font-black uppercase text-[#00A86B] mb-2">Оригинал</h3>
                <p className="text-sm text-slate-300 italic">{result.ocr_text}</p>
             </div>
             <div className="vaqta-glass p-6 border-[#D4AF37]/30">
                <h3 className="text-[10px] font-black uppercase text-[#D4AF37] mb-2">Перевод (UZ)</h3>
                <p className="text-lg font-bold">{result.translation}</p>
             </div>
             <button onClick={() => setResult(null)} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl font-bold">Новый скан</button>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#00A86B]" size={48} />
            <p className="text-[#00A86B] font-black uppercase tracking-[0.2em] animate-pulse">Анализирую изображение...</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}