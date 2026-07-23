"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ShieldAlert, Share2, Copy, Check, Phone, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { toast } from "sonner";

export default function SOSLegal() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleShareGeo = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const text = `🚨 SOS! Мне нужна помощь. Мои координаты: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
          navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success("Координаты и SOS текст скопированы!");
          setTimeout(() => setCopied(false), 2000);
        },
        () => {
          toast.error("Не удалось определить местоположение");
        }
      );
    }
  };

  const POLICE_PHRASES = [
    { ru: "Здравствуйте, вот мой паспорт, миграционная карта и патент.", native: "Assalomu alaykum, mana mening pasportim, migratsiya kartam va patentim." },
    { ru: "Подскажите, пожалуйста, причину проверки документов?", native: "Iltimos, hujjatlarni tekshirish sababini ayta olasizmi?" },
    { ru: "Все мои чеки оплаты патента сохранены в телефоне.", native: "Barcha patent to'lov cheklarim telefonda saqlangan." }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="sos.title" showBack />

      <main className="p-6 space-y-6">
        {/* Кнопка экстренного SOS */}
        <div className="vaqta-glass p-6 border-red-500/30 bg-red-500/5 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto border border-red-500/40 animate-pulse">
            <ShieldAlert size={36} />
          </div>
          <div>
            <h2 className="text-xl font-black text-red-400">{t("sos.title")}</h2>
            <p className="text-xs text-slate-300 font-medium">{t("sos.subtitle")}</p>
          </div>

          <button
            onClick={handleShareGeo}
            className="w-full h-16 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-3 shadow-xl hover:bg-red-700 transition-colors"
          >
            {copied ? <Check size={20} /> : <Share2 size={20} />}
            <span>{t("sos.send_coords")}</span>
          </button>
        </div>

        {/* Чек-лист законных прав */}
        <div className="vaqta-glass p-6 border-[#1A3D2E] space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#00A86B] flex items-center gap-2">
            <FileText size={16} /> {t("sos.rights_title")}
          </h3>

          <ul className="space-y-3 text-xs font-medium text-slate-200">
            <li className="p-3 bg-white/5 rounded-xl border border-white/5">{t("sos.rule_1")}</li>
            <li className="p-3 bg-white/5 rounded-xl border border-white/5">{t("sos.rule_2")}</li>
            <li className="p-3 bg-white/5 rounded-xl border border-white/5">{t("sos.rule_3")}</li>
            <li className="p-3 bg-white/5 rounded-xl border border-white/5">{t("sos.rule_4")}</li>
          </ul>
        </div>

        {/* Шпаргалка вежливых фраз */}
        <div className="vaqta-glass p-6 border-[#1A3D2E] space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
            <Phone size={16} /> {t("sos.phrases_title")}
          </h3>

          <div className="space-y-3">
            {POLICE_PHRASES.map((p, idx) => (
              <div key={idx} className="p-3 bg-[#06140F] border border-[#1A3D2E] rounded-xl space-y-1">
                <p className="text-xs font-bold text-white">{p.ru}</p>
                <p className="text-[10px] text-[#5C7A6D]">{p.native}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}