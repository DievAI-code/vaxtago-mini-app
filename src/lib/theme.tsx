import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import i18n, { setLanguage, SUPPORTED_LANGS, Lang } from "@/i18n";

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

export function useStrings() {
  const { t } = useAppI18n();
  return t;
}

// small hook to access i18n t inside components that used useStrings before
import { useTranslation } from "react-i18next";
function useAppI18n() {
  return useTranslation();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>((i18n.language as Lang) || "ru");
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("vaxtago_theme") as Theme) || "light",
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("vaxtago_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setLang = (l: Lang) => {
    setLanguage(l);
    setLangState(l);
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        theme,
        toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
