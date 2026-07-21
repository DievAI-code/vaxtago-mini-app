"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Loader2, AlertCircle, CheckCircle, FileText, Languages, Info } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/animations";

type Status = "idle" | "processing" | "success" | "error";

export default function Scanner() {
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPreview(URL.createObjectURL(file));
    setStatus("processing");
    
    // Simulate AI analysis
    setTimeout(() => {
      setStatus("success");
    }, 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] pb-32">
      <header className="p-6 border-b border-[#00A86B]/10 flex items-center justify-between">
        <h1 className="text-xl font-black italic">AI <span className="text-[#00A86B]">SKANER</span></h1>
        <div className="w-10 h-10 rounded-full bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
          <Scan size={20} />
        </div>
      </header>

      <main className="px-6 py-8 space-y-6">
        <FadeUp>
          <div className="ai-glass p-8 rounded-[2.5rem] text-center space-y-6 border-dashed border-2 border-[#00A86B]/30">
            {preview ? (
              <img src={preview} className="w-full h-48 object-cover rounded-2xl border border-[#00A86B]/20" alt="Preview" />
            ) : (
              <div className="w-20 h-20 bg-[#00A86B]/10 rounded-3xl flex items-center justify-center mx-auto text-[#00A86B]">
                <Camera size={40} />
              </div>
            )}
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Rasm yoki hujjat yuklang</h3>
              <p className="text-xs text-slate-400">Shtrix-kod, shartnoma yoki pasport — biz hammasini tushunamiz</p>
            </div>
            <input 
              type="file" 
              ref={fileRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleUpload}
            />
            <Button 
              onClick={() => fileRef.current?.click()}
              className="w-full vaqta-gradient rounded-2xl h-14 font-black uppercase tracking-widest"
            >
              📷 Rasm yuklash
            </Button>
          </div>
        </FadeUp>

        {status === "processing" && (
          <FadeUp>
            <div className="ai-card p-6 flex items-center gap-4 border-[#D4AF37]/30">
              <Loader2 className="text-[#D4AF37] animate-spin" size={24} />
              <div>
                <p className="font-bold text-sm">AI tahlil qilmoqda...</p>
                <p className="text-[10px] text-slate-500 italic">Hujjat mazmuni va tili aniqlanmoqda</p>
              </div>
            </div>
          </FadeUp>
        )}

        {status === "success" && (
          <FadeUp className="space-y-4">
            <div className="ai-card p-6 space-y-6">
              <div className="flex items-center gap-3 text-[#00A86B]">
                <CheckCircle size={20} />
                <span className="font-black text-sm uppercase">Tahlil yakunlandi</span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Languages size={14} />
                    <span className="text-[10px] font-bold uppercase">Tarjima (UZ)</span>
                  </div>
                  <p className="text-sm text-slate-200 bg-white/5 p-4 rounded-2xl border border-white/5">
                    Bu ish shartnomasi bo'lib, unda sizning oylik maoshingiz 120,000 rubl ekanligi va yotoqxona bilan ta'minlanishingiz ko'rsatilgan.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#00A86B]">
                    <Info size={14} />
                    <span className="text-[10px] font-bold uppercase">AI Tushuntirish</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Hujjat qonuniy kuchga ega. Asosiy e'tibor 5-bandga qaratilsin: u erda jarimalar haqida ma'lumot bor.
                  </p>
                </div>
              </div>

              <Button variant="outline" className="w-full rounded-xl border-[#00A86B]/20" onClick={() => setStatus("idle")}>
                Yangi skanerlash
              </Button>
            </div>
          </FadeUp>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
import { Scan } from "lucide-react";