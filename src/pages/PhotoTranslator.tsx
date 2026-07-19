UZ translation">
import { useState, useRef } from "react";
import { Camera, Upload, Languages, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VVision } from "@/components/icons/VaxtaGoIcons";
import { useTranslation } from "react-i18next";
import { FadeUp } from "@/components/animations";
import { supabase } from "@/integrations/supabase/client";
import { useTelegramUser } from "@/components/TelegramProvider";

type Status = "idle" | "processing" | "success" | "error";

export default function PhotoTranslator() {
  const { t } = useTranslation();
  const { telegramId, profile } = useTelegramUser();
  const [status, setStatus] = useState<Status>("idle");
  const [original, setOriginal] = useState("");
  const [translated, setTranslated] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const VISION_URL = "https://watkanjjfsvqbhebchpk.supabase.co/functions/v1/vision-assistant";

  const processFile = async (file: File) => {
    setStatus("processing");
    setOriginal("");
    setTranslated("");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const payload = {
          image: reader.result,
          message: "Распознай русский текст и переведи на узбекский. Верни формат: Оригинал: ... Перевод: ...",
          language: "uz",
          telegram_id: telegramId,
          user_id: profile?.id,
          request_type: "translate_ru_uz",
        };
        const res = await fetch(VISION_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data?.success) {
          const text = data.explanation || data.ocr_text || "";
          const origMatch = text.match(/Оригинал[:\s]*([\s\S]*?)Перевод[:\s]*([\s\S]*)/i);
          if (origMatch) {
            setOriginal(origMatch[1].trim());
            setTranslated(origMatch[2].trim());
          } else {
            setOriginal(data.ocr_text || "Текст не распознан");
            setTranslated(text);
          }
          await supabase.from("document_translations").insert({
            user_id: profile?.id ?? null,
            telegram_id: telegramId,
            image_url: (reader.result as string).slice(0, 100),
            original_text: original,
            translated_text: translated,
            created_at: new Date().toISOString(),
          }).catch(() => {});
          setStatus("success");
        } else {
          setStatus("error");
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0F172A] text-white">
      <Header title="Фото переводчик" />
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <FadeUp>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card onClick={() => cameraRef.current?.click()} className="text-center">
              <Camera className="w-8 h-8 text-[#14B8A6] mx-auto mb-2" /><span className="font-semibold text-sm">Камера</span>
            </Card>
            <Card onClick={() => fileRef.current?.click()} className="text-center">
              <Upload className="w-8 h-8 text-[#14B8A6] mx-auto mb-2" /><span className="font-semibold text-sm">Галерея</span>
            </Card>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
        </FadeUp>

        {status === "processing" && (
          <FadeUp><Card variant="gradient" className="flex items-center gap-3 mb-4"><Loader2 className="w-6 h-6 text-[#14B8A6] animate-spin" /><div><p className="font-semibold">AI обрабатывает...</p><p className="text-xs text-slate-400">Распознавание и перевод</p></div></Card></FadeUp>
        )}

        {status === "success" && (
          <FadeUp>
            <Card variant="default" className="mb-4">
              <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5 text-green-400" /><span className="font-semibold text-green-400">Готово</span></div>
              <p className="text-xs text-slate-400 mb-1">Оригинал (RU):</p>
              <p className="text-sm text-white whitespace-pre-wrap mb-3">{original}</p>
              <p className="text-xs text-slate-400 mb-1">Перевод (UZ):</p>
              <p className="text-sm text-[#14B8A6] whitespace-pre-wrap">{translated}</p>
            </Card>
          </FadeUp>
        )}

        {status === "error" && (
          <FadeUp><Card variant="gradient" className="mb-4 border-red-500/30"><div className="flex items-center gap-2 mb-2"><AlertCircle className="w-5 h-5 text-red-400" /><span className="font-semibold text-red-400">Ошибка</span></div><p className="text-sm text-slate-300">Не удалось обработать.</p><Button size="sm" variant="danger" className="mt-3" onClick={() => setStatus("idle")}>Повторить</Button></Card></FadeUp>
        )}

        <FadeUp>
          <Card variant="default" className="flex items-center gap-3">
            <VVision className="w-8 h-8 text-[#14B8A6]" />
            <div className="flex-1"><p className="font-bold">AI Vision</p><p className="text-xs text-slate-400">Русский → Узбекский из фото</p></div>
          </Card>
        </FadeUp>
      </div>
      <BottomNav />
    </div>
  );
}