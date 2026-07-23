"use client";

import { useState } from "react";
import { Camera, Loader2, Copy, Check, Globe, RefreshCw } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { subscription } from "@/services/subscription";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const TARGET_LANGS = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uz", label: "O'zbekcha", flag: "🇺🇿" },
  { code: "tg", label: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "kk", label: "Қазақша", flag: "🇰🇿" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export default function OcrTranslator() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ original: string; translated: string } | null>(null);
  const [targetLang, setTargetLang] = useState(language);
  const [copied, setCopied] = useState(false);

  const handleFile = async (file: File) => {
    const userPhone = localStorage.getItem("vaxtago_user_phone");
    if (!userPhone) return toast.error("Please login");

    const access = await subscription.checkUserAccess("ocr");
    if (!access.allowed) {
      toast.error(t("premium.feature_locked") || "Лимит OCR распознавания исчерпан.");
      return;
    }

    setLoading(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);

      try {
        const { data } = await supabase.functions.invoke("ocr-translator", {
          body: { image: base64, target_lang: targetLang, user_phone: userPhone }
        });

        if (data?.success) {
          setResult({ original: data.original, translated: data.translated });
          await subscription.trackUsage("ocr");
          toast.success(t("scanner.result_ready"));
        } else {
          throw new Error("AI error");
        }
      } catch (err) {
        toast.error(t("scanner.error_ai"));
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t("common.done"));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="nav.scanner" showBack />
      
      <main className="p-6 space-y-6">
        <div className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#5C7A6D]">
            <Globe size={16} className="text-[#00A86B]" />
            <span>{t("auth.select_lang")}</span>
          </div>
          <div className="flex gap-1">
            {TARGET_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setTargetLang(l.code as any)}
                className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all ${
                  targetLang === l.code ? "bg-[#00A86B] scale-110 shadow-lg" : "bg-white/5 grayscale"
                }`}
              >
                {l.flag}
              </button>
            ))}
          </div>
        </div>

        {!preview ? (
          <div className="flex flex-col gap-4">
             <label className="vaqta-glass p-10 border-dashed border-[#1A3D2E] flex flex-col items-center gap-4 cursor-pointer active:scale-95 transition-all">
                <div className="w-16 h-16 rounded-full vaqta-gradient flex items-center justify-center shadow-xl">
                  <Camera size={32} />
                </div>
                <div className="text-center">
                  <p className="font-black text-sm uppercase tracking-widest">{t("scanner.take_photo")}</p>
                  <p className="text-[10px] text-[#5C7A6D] mt-1">{t("scanner.upload_area")}</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
             </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative group">
              <img src={preview} className="w-full h-48 object-cover rounded-[2rem] border border-[#1A3D2E]" alt="Preview" />
              <button onClick={() => {setPreview(null); setResult(null);}} className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white">
                <RefreshCw size={16} />
              </button>
            </div>

            {loading && (
              <div className="vaqta-glass p-8 border-[#00A86B]/20 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-[#00A86B]" size={32} />
                <p className="text-[10px] font-black uppercase text-[#00A86B] animate-pulse tracking-[0.2em]">{t("scanner.step_analyze")}</p>
              </div>
            )}

            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="vaqta-glass p-6 border-[#1A3D2E]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-black uppercase text-[#5C7A6D] tracking-widest">{t("scanner.original_text")}</span>
                      <button onClick={() => copyToClipboard(result.original)} className="text-[#5C7A6D] hover:text-white"><Copy size={14} /></button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">{result.original}</p>
                  </div>

                  <div className="vaqta-glass p-6 border-[#00A86B]/40 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Globe size={60} /></div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-black uppercase text-[#00A86B] tracking-widest">{t("scanner.translation")}</span>
                      <button onClick={() => copyToClipboard(result.translated)} className="text-[#00A86B] hover:scale-110 transition-transform">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="text-sm font-bold text-white leading-relaxed">{result.translated}</p>
                  </div>

                  <button onClick={() => {setPreview(null); setResult(null);}} className="w-full h-16 vaqta-gradient rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                    {t("scanner.new_scan")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}