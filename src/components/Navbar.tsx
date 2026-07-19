import { useApp } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import { Moon, Sun, Globe } from "lucide-react";
import { useState } from "react";
import { SUPPORTED_LANGS, Lang } from "@/i18n";
import { VaxtaGoLogo } from "./VaxtaGoLogo";

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uz", label: "O'zbekcha", flag: "🇺🇿" },
  { code: "tg", label: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "ky", label: "Кыргызча", flag: "🇰🇬" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export function Navbar() {
  const { lang, setLang, theme, toggleTheme } = useApp();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#0F172A]/80 border-b border-slate-200/60 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <VaxtaGoLogo size={36} />
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-800 dark:text-white leading-tight tracking-tight">VaxtaGo</span>
            <span className="text-[11px] text-[#06B6D4] font-medium">AI Assistant</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 border border-slate-200 dark:border-slate-700"
              aria-label="Change language"
            >
              <Globe size={16} />
              <span className="hidden sm:inline">{LANGS.find((l) => l.code === lang)?.flag}</span>
              <span className="hidden md:inline">{LANGS.find((l) => l.code === lang)?.label}</span>
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 p-2">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors ${lang === l.code ? "text-[#2563EB] font-semibold bg-blue-50 dark:bg-blue-900/30" : "text-slate-600 dark:text-slate-300"}`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
