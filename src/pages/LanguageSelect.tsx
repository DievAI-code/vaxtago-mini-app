"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { ChevronRight } from "lucide-react";
import { Lang } from "@/i18n";

const LANGUAGES: { code: Lang; native: string; flag: string }[] = [
  { code: "ru", native: "Русский", flag: "🇷🇺" },
  { code: "uz", native: "Ўзбекча", flag: "🇺🇿" },
  { code: "kk", native: "Қазақша", flag: "🇰🇿" },
  { code: "en", native: "English", flag: "🇬🇧" },
];

export default function LanguageSelect() {
  const { setLanguage } = useLanguage();
  const nav = useNavigate();

  const handleSelect = async (code: Lang) => {
    try {
      localStorage.setItem("vaxtago_language", code);
      localStorage.setItem("vaqta_language", code);
      const phone = localStorage.getItem("vaxtago_user_phone");
      if (phone && supabase) {
        await supabase
          .from("users")
          .update({ language_code: code })
          .eq("phone_number", phone);
      }
      setLanguage(code);
      nav("/home", { replace: true });
    } catch (e) {
      console.error(e);
      nav("/home", { replace: true });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white p-8 items-center justify-center">
      <VaqtaLogo size={64} animated className="mb-8" />
      <h2 className="text-xl font-black mb-8 tracking-tight uppercase text-center">
        Выберите язык / Тилни танланг / Тілді таңдаңыз / Select Language
      </h2>
      
      <div className="w-full max-w-xs space-y-3">
        {LANGUAGES.map((lang, idx) => (
          <motion.button
            key={lang.code}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => handleSelect(lang.code)}
            className="w-full vaqta-glass p-5 flex items-center justify-between group hover:border-[#00A86B] transition-all"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-bold text-lg">{lang.native}</span>
            </div>
            <ChevronRight size={18} className="text-[#5C7A6D] group-hover:text-[#00A86B]" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}