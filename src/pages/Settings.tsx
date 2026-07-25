"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { Shield, Bell, ChevronRight, Check, Mic, Globe, Languages, Bug } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { Lang } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone } from "@/lib/normalizePhone";
import { mapDebug } from "@/services/maps/debug/mapDebug";

const LANGUAGES: { code: Lang; name: string; flag: string }[] = [
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "uz_lat", name: "Ўзбекча", flag: "🇺🇿" },
  { code: "en", name: "English", flag: "🇬🇧" },
];

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMapsDebugEnabled, setIsMapsDebugEnabled] = useState(mapDebug.isEnabled());

  const isAdmin = (() => {
    try {
      const session = localStorage.getItem("vaqta_admin_session");
      return session ? JSON.parse(session).role === "founder" : false;
    } catch {
      return false;
    }
  })();

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

  const toggleMapsDebug = () => {
    const next = !isMapsDebugEnabled;
    mapDebug.setEnabled(next);
    setIsMapsDebugEnabled(next);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="nav.settings" onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="px-6 space-y-6 mt-4 flex-1">
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">
            Основное
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate("/settings/voice")}
              className="w-full vaqta-glass p-4 flex items-center justify-between border-[#1A3D2E] active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#0AA86E]/10 text-[#0AA86E]">
                  <Mic size={18} />
                </div>
                <span className="font-bold text-sm">{t("settings_voice") || "Голос"}</span>
              </div>
              <ChevronRight size={16} className="text-[#5C7A6D]" />
            </button>
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
                <span className="font-bold text-sm">{t("privacy")}</span>
              </div>
              <ChevronRight size={16} className="text-[#5C7A6D]" />
            </div>
          </div>
        </section>

        {isAdmin && (
          <section className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">
              Отладка
            </h3>
            <div className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                  <Bug size={18} />
                </div>
                <div>
                  <span className="font-bold text-sm block">Maps Debug Mode</span>
                  <span className="text-[10px] text-[#5C7A6D]">Логирование запросов карт</span>
                </div>
              </div>
              <button
                onClick={toggleMapsDebug}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${isMapsDebugEnabled ? "bg-[#0AA86E]" : "bg-[#1A3D2E]"}`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-5 h-5 rounded-full bg-white shadow"
                  style={{ marginLeft: isMapsDebugEnabled ? "20px" : "0px" }}
                />
              </button>
            </div>
          </section>
        )}

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

        <div className="pt-8 text-center text-xs text-[#5C7A6D] font-mono">
          <p>VAQTA AI v3.0 • RU, UZ, EN</p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

import { motion } from "framer-motion";