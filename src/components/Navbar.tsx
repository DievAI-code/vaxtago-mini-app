import { useApp, useStrings } from "@/lib/theme";
import { Moon, Sun, Globe } from "lucide-react";
import { useState } from "react";

const LANGS = [
  { code: "ru", label: "Русский" },
  { code: "uz", label: "O'zbekcha" },
  { code: "tg", label: "Тоҷикӣ" },
  { code: "ky", label: "Кыргызча" },
  { code: "en", label: "English" },
] as const;

export function Navbar() {
  const { lang, setLang, theme, toggleTheme } = useApp();
  const s = useStrings();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-700/60">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold">
            V
          </div>
          <span className="font-bold text-lg text-slate-800 dark:text-white">VaxtaGo</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Change language"
            >
              <Globe size={16} /> {LANGS.find((l) => l.code === lang)?.label.slice(0, 2)}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 p-1.5">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-blue-50 dark:hover:bg-slate-700 ${
                      lang === l.code ? "text-blue-600 font-semibold" : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
}