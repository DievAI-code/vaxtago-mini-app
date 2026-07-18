import { useNavStack } from "./NavigationStack";
import { VaxtaGoLogo } from "./VaxtaGoLogo";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useApp } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { SUPPORTED_LANGS, Lang } from "@/i18n";
import { Globe, Moon, Sun } from "lucide-react";

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uz", label: "O'zbekcha", flag: "🇺🇿" },
  { code: "tg", label: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "ky", label: "Кыргызча", flag: "🇰🇬" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export function Header({ title, showBack = true }: { title: string; showBack?: boolean }) {
  const { pop, canGoBack } = useNavStack();
  const { lang, setLang, theme, toggleTheme } = useApp();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0F172A]/80 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && canGoBack && (
            <button
              onClick={pop}
              className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <VaxtaGoLogo size={32} />
            <span className="font-bold text-lg text-white">{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
              aria-label="Menu"
            >
              <MoreVertical size={20} />
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-800 shadow-xl border border-slate-700 p-2">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-slate-700 transition-colors ${lang === l.code ? "text-[#06B6D4] font-semibold" : "text-slate-300"}`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => { toggleTheme(); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                  <span>{theme === "light" ? "Темная" : "Светлая"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}