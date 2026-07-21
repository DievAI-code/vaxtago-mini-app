"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import i18n, { setLanguage as setI18nLang, Lang } from "@/i18n";
import { useTranslation } from "react-i18next";

interface LanguageContextType {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const [language, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("vaxtago_language") as Lang;
    return saved || (i18n.language as Lang) || "uz";
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
    console.log(`[VAQTA] Language switched to: ${lang}`);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};