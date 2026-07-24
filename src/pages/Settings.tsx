"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { Shield, Bell, ChevronRight, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { Lang } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone } from "@/lib/normalizePhone";

const LANGUAGES: { code: Lang; name: string; flag: string }[] = [
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "uz", name: "Ўзбекча", flag: "🇺🇿" },
  { code: "kk", name: "Қазақша", flag: "🇰🇿" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSetLang = async (code: Lang) => {
    setLanguage(code);
    localStorage.setItem("vaxtago_language", code);
    localStorage.setItem("vaqta_language", code);

    const rawPhone = localStorage.getItem("vaxtago_user_phone");
    if (rawPhone) {
      const phone = normalizePhone(rawPhone);
      if (supabase) {
        try {
          await supabase
            .from("users")
            .update({ language_code: code, updated_at: new Date().toISOString() })
            .eq("phone_number", phone);
        } catch (err) {
          console.error("Supabase language update failed:", err);
        }
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="nav.settings" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="px-6 space-y-6 mt-4 flex-1">
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">
            {t("settings_lang") || "Язык"}
          </h3>
          <div className="space-y-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleSetLang(l.code)}
                className={`w-full vaqta-glass p-4 flex items-center justify-between transition-all ${
                  language === l.code ? "border-[#00A86B] bg-[#00A86B]/10" : "border-[#1A3D2E]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{l.flag}</span>
                  <span className="font-bold text-sm">{l.name}</span>
                </div>
                {language === l.code && <Check size={18} className="text-[#00A86B]" />}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3 pt-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">
            {t("nav.settings")}
          </h3>
          <div className="space-y-2">
            <div className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-[#00A86B]" />
                <span className="font-bold text-sm">Уведомления</span>
              </div>
              <span className="text-xs font-bold text-[#00A86B]">Включены</span>
            </div>

            <div className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-[#D4AF37]" />
                <span className="font-bold text-sm">{t("nav.policy")}</span>
              </div>
              <ChevronRight size={18} className="text-[#5C7A6D]" />
            </div>
          </div>
        </section>

        <div className="pt-8 text-center text-xs text-[#5C7A6D] font-mono">
          <p>VAQTA AI v3.0 • RU, UZ, KK, EN</p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}