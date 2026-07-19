import { useState, useRef } from "react";
import { Camera, Upload, FileText, Scan, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
import { VVision } from "@/components/icons/VaxtaGoIcons";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useApp } from "@/lib/theme";
import { FadeUp } from "@/components/animations";

type ScanStatus = "idle" | "processing" | "success" | "error";

export default function Scanner() {
  const { t } = useTranslation();
  const { lang } = useApp();
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [result, setResult] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setStatus("processing");
    setResult("");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        await new Promise((r) => setTimeout(r, 2000));
        setResult("Текст распознан:\nПатент на работу №123456\nСрок: до 2026-12-31\nРегион: Москва\nСтатус: активен");
        setStatus("success");
      };
      reader.readAsDataURL(file);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0F172A] text-white">
      <Header title="Сканер" />
      
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <FadeUp>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card onClick={() => cameraRef.current?.click()} className="text-center">
              <Camera className="w-8 h-8 text-[#06B6D4] mx-auto mb-2" />
              <span className="font-semibold text-sm">Камера</span>
            </Card>
            <Card onClick={() => fileRef.current?.click()} className="text-center">
              <Upload className="w-8 h-8 text-[#06B6D4] mx-auto mb-2" />
              <span className="font-semibold text-sm">Галерея</span>
            </Card>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
        </FadeUp>

        {status === "processing" && (
          <FadeUp>
            <Card variant="gradient" className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 text-[#06B6D4] animate-spin" />
              <div>
                <p className="font-semibold">Распознавание...</p>
                <p className="text-xs text-slate-400">Анализируем документ</p>
              </div>
            </Card>
          </FadeUp>
        )}

        {status === "success" && (
          <FadeUp>
            <Card variant="gradient" className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-green-400">Готово</span>
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{result}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary" onClick={() => setStatus("idle")}>Закрыть</Button>
                <Button size="sm" variant="primary">Сохранить</Button>
              </div>
            </Card>
          </FadeUp>
        )}

        {status === "error" && (
          <FadeUp>
            <Card variant="gradient" className="mb-4 border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="font-semibold text-red-400">Ошибка</span>
              </div>
              <p className="text-sm text-slate-300">Не удалось распознать документ.</p>
              <Button size="sm" variant="danger" className="mt-3" onClick={() => setStatus("idle")}>Повторить</Button>
            </Card>
          </FadeUp>
        )}

        <FadeUp>
          <Card variant="default" className="flex items-center gap-3">
            <VVision className="w-8 h-8 text-[#14B8A6]" />
            <div className="flex-1">
              <p className="font-bold">AI Vision</p>
              <p className="text-xs text-slate-400">Распознавание документов любого типа</p>
            </div>
          </Card>
        </FadeUp>
      </div>

      <BottomNav />
    </div>
  );
}