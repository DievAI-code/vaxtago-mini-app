import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Loader2, AlertCircle, CheckCircle, Copy, Save, Volume2 } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { FadeUp } from "@/components/animations";
import { supabase } from "@/integrations/supabase/client";
import { useTelegramUser } from "@/components/TelegramProvider";
import { analytics } from "@/services/Analytics";
import { getSupabaseUrl } from "@/lib/env";

type Status = "idle" | "processing" | "success" | "error";

export default function PhotoTranslator() {
  const { t } = useTranslation();
  const { user } = useTelegramUser();
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<string>("");
  const [original, setOriginal] = useState("");
  const [translated, setTranslated] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const VISION_URL = `${getSupabaseUrl()}/functions/v1/vision-assistant`;

  const processFile = async (file: File) => {
    setStatus("processing");
    setOriginal("");
    setTranslated("");
    analytics.track("photo_translate_start");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        const res = await fetch(VISION_URL, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            image: dataUrl,
            language: "uz",
            user_id: user?.id,
            request_type: "translate_ru_uz",
          }),
        });
        const data = await res.json();
        if (data?.success) {
          setOriginal(data.ocr_text || "Текст не распознан");
          setTranslated(data.translation || data.explanation || "");
          setStatus("success");
          analytics.track("photo_translate_success");
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
      <Header title="📷 Фото переводчик" />
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <FadeUp>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card onClick={() => cameraRef.current?.click()} className="text-center p-4 cursor-pointer">
              <Camera className="w-8 h-8 text-[#00A86B] mx-auto mb-2" />
              <span className="font-semibold text-sm">Камера</span>
            </Card>
            <Card onClick={() => fileRef.current?.click()} className="text-center p-4 cursor-pointer">
              <ImageIcon className="w-8 h-8 text-[#00A86B] mx-auto mb-2" />
              <span className="font-semibold text-sm">Галерея</span>
            </Card>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
        </FadeUp>

        {status === "processing" && (
          <div className="text-center py-10">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#00A86B]" />
            <p className="mt-4 text-slate-400">AI переводит документ...</p>
          </div>
        )}

        {status === "success" && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-green-400 font-bold">
              <CheckCircle size={20} /> Готово
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-black">Оригинал</p>
              <p className="text-sm mt-1">{original}</p>
            </div>
            <div>
              <p className="text-xs text-[#00A86B] uppercase font-black">Перевод</p>
              <p className="text-sm mt-1">{translated}</p>
            </div>
          </Card>
        )}

        {status === "error" && (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
            <AlertCircle className="mx-auto text-red-500 mb-2" />
            <p className="text-sm font-bold">Ошибка обработки</p>
            <Button onClick={() => setStatus("idle")} variant="secondary" className="mt-4">Повторить</Button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}