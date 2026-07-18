import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, FileText, Scan, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
import { VDocument, VShield } from "@/components/icons/VaxtaGoIcons";
import { useTranslation } from "react-i18next";
import { useApp } from "@/lib/theme";
import { FadeUp, stagger, fadeUp } from "@/components/animations";

type DocStatus = "idle" | "processing" | "success" | "error";

export default function Documents() {
  const { t } = useTranslation();
  const { lang } = useApp();
  const [status, setStatus] = useState<DocStatus>("idle");
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
        setResult("Документ успешно распознан. Текст: Патент на работу №123456. Срок действия: до 2026-12-31. Регион: Москва.");
        setStatus("success");
      };
      reader.readAsDataURL(file);
    } catch {
      setStatus("error");
    }
  };

  const docs = [
    { name: "Патент_2026.pdf", status: "verified", date: "2 дн назад" },
    { name: "Договор.docx", status: "warning", date: "5 дн назад" },
    { name: "Паспорт.jpg", status: "verified", date: "1 нед назад" },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0F172A] text-white">
      <Header title="Документы" />
      
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <FadeUp>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card onClick={() => cameraRef.current?.click()} className="text-center">
              <Camera className="w-8 h-8 text-[#06B6D4] mx-auto mb-2" />
              <span className="font-semibold text-sm">Камера</span>
            </Card>
            <Card onClick={() => fileRef.current?.click()} className="text-center">
              <Upload className="w-8 h-8 text-[#06B6D4] mx-auto mb-2" />
              <span className="font-semibold text-sm">Загрузить</span>
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
              <p className="text-sm text-slate-300">Не удалось распознать документ. Попробуйте еще раз.</p>
              <Button size="sm" variant="danger" className="mt-3" onClick={() => setStatus("idle")}>Повторить</Button>
            </Card>
          </FadeUp>
        )}

        <FadeUp>
          <h3 className="text-lg font-bold mb-3 px-1">Мои документы</h3>
          <div className="space-y-2">
            {docs.map((doc, i) => (
              <Card key={i} variant="default" className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-[#06B6D4]">
                  <VDocument className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{doc.name}</p>
                  <p className="text-xs text-slate-400">{doc.date}</p>
                </div>
                {doc.status === "verified" ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                )}
              </Card>
            ))}
          </div>
        </FadeUp>

        <FadeUp>
          <Card variant="gradient" className="mt-6 flex items-center gap-3">
            <VShield className="w-8 h-8 text-[#14B8A6]" />
            <div className="flex-1">
              <p className="font-bold">Проверка работодателя</p>
              <p className="text-xs text-slate-400">Проверьте компанию перед трудоустройством</p>
            </div>
            <Button size="sm" variant="secondary">Проверить</Button>
          </Card>
        </FadeUp>
      </div>

      <BottomNav />
    </div>
  );
}