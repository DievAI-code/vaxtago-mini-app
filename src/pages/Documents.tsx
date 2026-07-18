import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, FileText, Scan, CheckCircle, AlertCircle, Loader2, Languages, Database } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VDocument, VShield } from "@/components/icons/VaxtaGoIcons";
import { useTranslation } from "react-i18next";
import { FadeUp } from "@/components/animations";

type DocStatus = "idle" | "processing" | "success" | "error";

export default function Documents() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<DocStatus>("idle");
  const [result, setResult] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setStatus("processing"); setResult("");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        await new Promise((r) => setTimeout(r, 2000));
        setResult("Документ успешно распознан. Текст: Патент на работу №123456. Срок: до 2026-12-31. Регион: Москва.");
        setStatus("success");
      };
      reader.readAsDataURL(file);
    } catch { setStatus("error"); }
  };

  const docs = [
    { name: "Патент_2026.pdf", status: "verified", date: "2 дн назад" },
    { name: "Договор.docx", status: "warning", date: "5 дн назад" },
    { name: "Паспорт.jpg", status: "verified", date: "1 нед назад" },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-[#080B14] text-white">
      <Header title="Документы" />
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <FadeUp>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card onClick={() => cameraRef.current?.click()} className="text-center">
              <Camera className="w-8 h-8 text-[#7C3AED] mx-auto mb-2" /><span className="font-semibold text-sm">Камера</span>
            </Card>
            <Card onClick={() => fileRef.current?.click()} className="text-center">
              <Upload className="w-8 h-8 text-[#7C3AED] mx-auto mb-2" /><span className="font-semibold text-sm">Загрузить</span>
            </Card>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
        </FadeUp>

        {status === "processing" && (<FadeUp><Card variant="gradient" className="flex items-center gap-3 mb-4"><Loader2 className="w-6 h-6 text-[#7C3AED] animate-spin" /><div><p className="font-semibold">Распознавание...</p><p className="text-xs text-white/70">Анализируем документ</p></div></Card></FadeUp>)}
        {status === "success" && (<FadeUp><Card variant="gradient" className="mb-4"><div className="flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5 text-[#22C55E]" /><span className="font-semibold text-[#22C55E]">Готово</span></div><p className="text-sm text-white/80 whitespace-pre-wrap">{result}</p><div className="flex gap-2 mt-3"><Button size="sm" variant="secondary" onClick={() => setStatus("idle")}>Закрыть</Button><Button size="sm" variant="primary">Сохранить</Button></div></Card></FadeUp>)}
        {status === "error" && (<FadeUp><Card variant="gradient" className="mb-4 border-red-500/30"><div className="flex items-center gap-2 mb-2"><AlertCircle className="w-5 h-5 text-red-400" /><span className="font-semibold text-red-400">Ошибка</span></div><p className="text-sm text-white/80">Не удалось распознать.</p><Button size="sm" variant="danger" className="mt-3" onClick={() => setStatus("idle")}>Повторить</Button></Card></FadeUp>)}

        <FadeUp>
          <div className="grid grid-cols-3 gap-2 mb-6">
            <Card className="text-center py-3"><Scan className="w-6 h-6 text-[#7C3AED] mx-auto mb-1" /><span className="text-xs">AI</span></Card>
            <Card className="text-center py-3"><Languages className="w-6 h-6 text-[#7C3AED] mx-auto mb-1" /><span className="text-xs">Перевод</span></Card>
            <Card className="text-center py-3"><Database className="w-6 h-6 text-[#7C3AED] mx-auto mb-1" /><span className="text-xs">Хранение</span></Card>
          </div>
        </FadeUp>

        <FadeUp>
          <h3 className="text-lg font-bold mb-3 px-1">Мои документы</h3>
          <div className="space-y-2">
            {docs.map((doc, i) => (
              <Card key={i} variant="default" className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#7C3AED]"><VDocument className="w-5 h-5" /></div>
                <div className="flex-1"><p className="font-medium text-sm">{doc.name}</p><p className="text-xs text-slate-400">{doc.date}</p></div>
                {doc.status === "verified" ? <CheckCircle className="w-5 h-5 text-[#22C55E]" /> : <AlertCircle className="w-5 h-5 text-[#F59E0B]" />}
              </Card>
            ))}
          </div>
        </FadeUp>

        <FadeUp>
          <Card variant="gradient" className="mt-6 flex items-center gap-3">
            <VShield className="w-8 h-8 text-[#22C55E]" />
            <div className="flex-1"><p className="font-bold">Проверка работодателя</p><p className="text-xs text-white/70">Проверьте компанию перед трудоустройством</p></div>
            <Button size="sm" variant="secondary">Проверить</Button>
          </Card>
        </FadeUp>
      </div>
      <BottomNav />
    </div>
  );
}