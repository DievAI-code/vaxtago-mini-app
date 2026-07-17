import { useState, useRef } from "react";
import { Camera, Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useApp } from "@/lib/theme";

export default function Scanner() {
  const { t } = useTranslation();
  const { lang } = useApp();
  const [result, setResult] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    setIsProcessing(true);
    setResult("");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id ?? "anonymous";

        const { data, error } = await supabase.functions.invoke("ai-router", {
          body: {
            type: "vision",
            user_id: userId,
            message: "Распознай и проанализируй документ",
            image: base64,
            language: lang,
          },
        });

        if (error) throw error;
        setResult(data.reply);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setResult(t("scanner_error"));
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-purple-800">{t("scanner_title")}</h1>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center p-4 bg-white rounded-2xl shadow hover:scale-105 transition">
            <Camera size={32} className="text-purple-600" />
            <span className="text-xs mt-2">{t("scanner_camera")}</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center p-4 bg-white rounded-2xl shadow hover:scale-105 transition">
            <Upload size={32} className="text-purple-600" />
            <span className="text-xs mt-2">{t("scanner_gallery")}</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center p-4 bg-white rounded-2xl shadow hover:scale-105 transition">
            <FileText size={32} className="text-purple-600" />
            <span className="text-xs mt-2">{t("scanner_file")}</span>
          </button>
        </div>

        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />

        {isProcessing && (
          <div className="text-center text-purple-600 py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4">{t("scanner_processing")}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <h3 className="font-semibold mb-2">{t("scanner_result")}</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}