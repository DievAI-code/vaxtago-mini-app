"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/lib/theme";
import { Lang } from "@/i18n";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { Globe, ChevronRight } from "lucide-react";

const LANGUAGES: { code: Lang; name: string; native: string; flag: string }[] = [
  { code: "uz", name: "Uzbek", native: "O'zbekcha", flag: "🇺🇿" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "tg", name: "Tajik", native: "Тоҷикӣ", flag: "🇹🇯" },
];

export default function LanguageSelect() {
  const { setLang } = useApp();
  const nav = useNavigate();

  const handleSelect = (code: Lang) => {
    setLang(code);
    localStorage.setItem("vaxtago_first_run", "false");
    nav("/home", { replace: true });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white p-6 items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-8 w-full max-w-sm"
      >
        <div className="flex flex-col items-center gap-4">
          <VaqtaLogo size={64} animated glow />
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight">VAQTA AI</h1>
            <p className="text-[#5C7A6D] text-xs font-bold uppercase tracking-widest">
              Ish va hayot uchun aqlli yordamchi
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          {LANGUAGES.map((lang, idx) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(lang.code)}
              className="w-full vaqta-glass p-5 flex items-center justify-between group hover:border-[#00A86B]/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <p className="font-bold text-lg">{lang.native}</p>
                  <p className="text-xs text-[#5C7A6D] font-medium">{lang.name}</p>
                </div>
              </div>
              <ChevronRight className="text-[#5C7A6D] group-hover:text-[#00A86B] transition-colors" />
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2 justify-center text-[#5C7A6D]">
          <Globe size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">Select Language</span>
        </div>
      </motion.div>
    </div>
  );
}