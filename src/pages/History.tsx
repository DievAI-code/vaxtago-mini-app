"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { Clock, FileText, MapPin, MessageSquare, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";

export default function History() {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [docHistory, setDocHistory] = useState<any[]>([]);
  const [placesHistory, setPlacesHistory] = useState<any[]>([]);

  useEffect(() => {
    try {
      setDocHistory(JSON.parse(localStorage.getItem("vaqta_doc_history") || "[]"));
      setPlacesHistory(JSON.parse(localStorage.getItem("vaqta_places_history") || "[]"));
    } catch {}
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("vaqta_doc_history");
    localStorage.removeItem("vaqta_places_history");
    setDocHistory([]);
    setPlacesHistory([]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="nav.history" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="px-6 space-y-6 mt-4 flex-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">{t("nav.history")}</h2>
          {(docHistory.length > 0 || placesHistory.length > 0) && (
            <button onClick={clearHistory} className="text-xs text-red-400 font-bold flex items-center gap-1 p-2 bg-red-500/10 rounded-xl">
              <Trash2 size={14} /> Очистить
            </button>
          )}
        </div>

        {docHistory.length === 0 && placesHistory.length === 0 ? (
          <div className="text-center py-20 opacity-40 space-y-3">
            <Clock size={48} className="mx-auto text-[#00A86B]" />
            <p className="text-sm font-bold">История пока пуста</p>
          </div>
        ) : (
          <>
            {docHistory.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase text-[#5C7A6D]">Сканированные документы</h3>
                {docHistory.map((d, i) => (
                  <div key={i} className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-[#00A86B]" />
                      <div>
                        <p className="text-xs font-bold">{d.doc_type}</p>
                        <p className="text-[10px] text-[#5C7A6D] truncate max-w-[200px]">{d.summary}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {placesHistory.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-[10px] font-black uppercase text-[#D4AF37]">Искали на карте</h3>
                {placesHistory.map((p, i) => (
                  <div key={i} className="vaqta-glass p-4 border-[#1A3D2E] flex items-center gap-3">
                    <MapPin size={18} className="text-[#D4AF37]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{p.name}</p>
                      <p className="text-[10px] text-[#5C7A6D] truncate">{p.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}