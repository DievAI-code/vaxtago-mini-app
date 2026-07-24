"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { Clock, FileText, MapPin, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone } from "@/lib/normalizePhone";

export default function History() {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [ocrHistory, setOcrHistory] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const rawPhone = localStorage.getItem("vaxtago_user_phone");
      if (rawPhone) {
        const phone = normalizePhone(rawPhone);
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("phone_number", phone)
          .maybeSingle();

        if (user) {
          const { data } = await supabase
            .from("ocr_history")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);

          if (data) setOcrHistory(data);
        }
      }
    } catch (e) {
      console.warn("History fetch error:", e);
    }
  };

  const clearHistory = async () => {
    try {
      const rawPhone = localStorage.getItem("vaxtago_user_phone");
      if (rawPhone) {
        const phone = normalizePhone(rawPhone);
        const { data: user } = await supabase.from("users").select("id").eq("phone_number", phone).maybeSingle();
        if (user) {
          await supabase.from("ocr_history").delete().eq("user_id", user.id);
        }
      }
    } catch (e) {}
    setOcrHistory([]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="nav.history" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="px-6 space-y-6 mt-4 flex-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">{t("nav.history")}</h2>
          {ocrHistory.length > 0 && (
            <button onClick={clearHistory} className="text-xs text-red-400 font-bold flex items-center gap-1 p-2 bg-red-500/10 rounded-xl">
              <Trash2 size={14} /> Очистить
            </button>
          )}
        </div>

        {ocrHistory.length === 0 ? (
          <div className="text-center py-20 opacity-40 space-y-3">
            <Clock size={48} className="mx-auto text-[#00A86B]" />
            <p className="text-sm font-bold">История пока пуста</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase text-[#5C7A6D]">Распознанные документы</h3>
            {ocrHistory.map((d) => (
              <div key={d.id} className="vaqta-glass p-4 border-[#1A3D2E] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#00A86B] font-bold">
                  <div className="flex items-center gap-2">
                    <FileText size={16} />
                    <span>Язык: {(d.target_language || "ru").toUpperCase()}</span>
                  </div>
                  <span className="text-[9px] text-[#5C7A6D]">{new Date(d.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">{d.translated_text || d.original_text}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}