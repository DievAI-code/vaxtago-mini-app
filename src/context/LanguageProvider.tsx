"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import i18n, { setLanguage as setI18nLang, Lang } from "@/i18n";
import { useTranslation } from "react-i18next";
import ruLocale from "@/i18n/locales/ru.json";

interface LanguageContextType {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined) ? prev[curr] : undefined, obj);
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { t: i18nT } = useTranslation();
  const [language, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("vaxtago_language") as Lang;
    return saved || (i18n.language as Lang) || "ru";
  });

  useEffect(() => {
    document.documentElement.lang = language;
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  const handleSetLanguage = (lang: Lang) => {
    setI18nLang(lang);
    setLangState(lang);
    localStorage.setItem("vaxtago_language", lang);
  };

  // Безопасный метод перевода с каскадным fallback на русский язык
  const safeT = (key: string): string => {
    if (!key) return "";
    const translated = i18nT(key);
    // Если результат перевода равен самому ключу, пробуем найти в румынском/русском словаре напрямую
    if (translated === key) {
      const ruValue = getNestedValue(ruLocale, key);
      if (ruValue && typeof ruValue === "string") {
        return ruValue;
      }
    }
    return translated;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t: safeT }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};