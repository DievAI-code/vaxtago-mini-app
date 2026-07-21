import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import i18n, { setLanguage, Lang } from "@/i18n";

type Theme = "light" | "dark";

interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("vaxtago_language") as Lang;
    return saved || (i18n.language as Lang) || "uz";
  });
  
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("vaxtago_theme") as Theme) || "dark",
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("vaxtago_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleSetLang = (l: Lang) => {
    setLanguage(l);
    setLangState(l);
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang: handleSetLang,
        theme,
        toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}