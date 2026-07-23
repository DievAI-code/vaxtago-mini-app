"use client";

import { useState } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { Lang } from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const LANGUAGES = [
  { code: "ru" as Lang, name: "Русский", flag: "🇷🇺" },
  { code: "en" as Lang, name: "English", flag: "🇬🇧" },
  { code: "kk" as Lang, name: "Қазақша", flag: "🇰🇿" },
  { code: "uz" as Lang, name: "O'zbek", flag: "🇺🇿" },
  { code: "tg" as Lang, name: "Тоҷикӣ", flag: "🇹🇯" },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleLanguageChange = async (newLang: Lang) => {
    if (newLang === language) return;
    
    setSaving(true);
    try {
      localStorage.setItem("vaxtago_language", newLang);
      
      const userPhone = localStorage.getItem("vaxtago_user_phone");
      if (userPhone && supabase) {
        await supabase
          .from("users")
          .update({ 
            language_code: newLang,
            updated_at: new Date().toISOString()
          })
          .eq("phone_number", userPhone);
      }
      
      setLanguage(newLang);
    } catch (error) {
      console.error("Error saving language:", error);
    } finally {
      setSaving(false);
      setIsOpen(false);
    }
  };

  const currentLang = LANGUAGES.find((lang) => lang.code === language) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={saving}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        <Globe size={14} className="text-[#00A86B]" />
        <span>{currentLang.flag}</span>
        <span className="hidden sm:inline font-bold">{currentLang.name}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-44 bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    disabled={saving}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors font-bold ${
                      language === lang.code
                        ? "bg-[#00A86B]/20 text-[#00A86B]"
                        : "text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span className="flex-1 text-left">{lang.name}</span>
                    {language === lang.code && <Check size={14} className="text-[#00A86B]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}