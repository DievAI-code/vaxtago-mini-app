"use client";

import { useRef, useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SideMenu } from "@/components/SideMenu";
import { useLanguage } from "@/context/LanguageProvider";
import { Camera, FileText, Loader2, AlertTriangle, Info, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FadeUp } from "@/components/animations";

type RiskItem = {
  title: string;
  level: "attention" | "info";
  detail: string;
};

export default function ContractAudit() {
  const { t, language } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const runLocalHeuristics = (text: string): RiskItem[] => {
    const low = text.toLowerCase();
    const items: RiskItem[] = [];

    if (/штраф|удержан| ensuring|fine|jarima|штраф/.test(low)) {
      items.push({
        title: t("contract.risk_penalty"),
        level: "attention",
        detail: t("contract.risk_penalty_d"),
      });
    }
    if (/жил|жилье|housing|kvartira|uy-joy|проживан/.test(low)) {
      items.push({
        title: t("contract.risk_housing"),
        level: "attention",
        detail: t("contract.risk_housing_d"),
      });
    }
    if (/расторг|увольн|dismiss|ishdan|разорв/.test(low)) {
      items.push({
        title: t("contract.risk_exit"),
        level: "attention",
        detail: t("contract.risk_exit_d"),
      });
    }
    if (/паспорт|document|hujjat|құжат/.test(low)) {
      items.push({
        title: t("contract.risk_docs"),
        level: "info",
        detail: t("contract.risk_docs_d"),
      });
    }
    if (!items.length) {
      items.push({
        title: t("contract.risk_general"),
        level: "info",
        detail: t("contract.risk_general_d"),
      });
    }
    return items;
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setSummary("");
    setRisks([]);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl.startsWith("data:image") ? dataUrl : null);

        let text = "";
        try {
          if (supabase) {
            const { data } = await supabase.functions.invoke("vision-assistant", {
              body: {
                image: dataUrl,
                language,
                request_type: "contract_audit",
                message: t("contract.ai_prompt"),
              },
            });
            text =
              data?.explanation ||
              data?.ocr_text ||
              data?.translation ||
              data?.reply ||
              "";
          }
        } catch {
          /* fallback below */
        }

        if (!text) {
          text = t("contract.fallback_summary");
        }

        setSummary(text);
        setRisks(runLocalHeuristics(text + " " + file.name));
        toast.success(t("contract.ready"));
        setLoading(false);
      };
      reader.onerror = () => {
        setLoading(false);
        toast.error(t("common.error"));
      };
      reader.readAsDataURL(file);
    } catch {
      setLoading(false);
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="nav.contract" onMenuClick={() => setMenuOpen(true)} showBack />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="px-5 space-y-5 mt-2">
        <FadeUp>
          <div className="vaqta-glass p-5 border-[#D4AF37]/25 space-y-2">
            <h2 className="text-lg font-black">{t("contract.title")}</h2>
            <p className="text-xs text-[#5C7A6D] leading-relaxed">{t("contract.subtitle")}</p>
          </div>
        </FadeUp>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="vaqta-glass p-5 border-[#1A3D2E] flex flex-col items-center gap-2 active:scale-95 transition"
          >
            <Camera className="text-[#00A86B]" size={28} />
            <span className="text-xs font-bold">{t("scanner.take_photo")}</span>
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="vaqta-glass p-5 border-[#1A3D2E] flex flex-col items-center gap-2 active:scale-95 transition"
          >
            <Upload className="text-[#D4AF37]" size={28} />
            <span className="text-xs font-bold">{t("contract.upload")}</span>
          </button>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />

        {preview && (
          <img src={preview} alt="contract" className="w-full max-h-52 object-cover rounded-3xl border border-[#1A3D2E]" />
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 py-10 text-[#00A86B]">
            <Loader2 className="animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest">{t("contract.analyzing")}</span>
          </div>
        )}

        {summary && (
          <div className="space-y-3">
            <div className="vaqta-glass p-5 border-[#00A86B]/30 space-y-2">
              <div className="flex items-center gap-2 text-[#00A86B] text-xs font-black uppercase">
                <FileText size={16} /> {t("contract.summary")}
              </div>
              <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">{summary}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-1">
                {t("contract.risks")}
              </h3>
              {risks.map((r, i) => (
                <div
                  key={i}
                  className={`vaqta-glass p-4 border ${
                    r.level === "attention" ? "border-amber-500/30" : "border-[#1A3D2E]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {r.level === "attention" ? (
                      <AlertTriangle size={16} className="text-amber-400" />
                    ) : (
                      <Info size={16} className="text-[#00A86B]" />
                    )}
                    <span className="text-xs font-bold">{r.title}</span>
                  </div>
                  <p className="text-[11px] text-[#5C7A6D] leading-relaxed">{r.detail}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-[#5C7A6D] leading-relaxed px-1">{t("contract.disclaimer")}</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}