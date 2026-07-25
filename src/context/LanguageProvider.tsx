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

function humanizeKey(key: string): string {
  // Превращает "home.action_translate" в "Action translate"
  // Используется только в КРАЙНЕМ случае, когда нет ни перевода, ни ru-fallback
  const parts = key.split(".");
  const last = parts[parts.length - 1] || parts[0];
  return last
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { t: i18nT } = useTranslation();
  const [language, setLangState] = useState<Lang>(() => {
    const saved = (localStorage.getItem("vaxtago_language") || localStorage.getItem("vaqta_language")) as Lang;
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
    localStorage.setItem("vaqta_language", lang);
  };

  const safeT = (key: string): string => {
    if (!key) return "";

    // 1. Сначала — текущая локаль (через i18next)
    const translated = i18nT(key);
    if (translated && translated !== key) return translated;

    // 2. Иначе — fallback на русский словарь
    const ruValue = getNestedValue(ruLocale, key);
    if (typeof ruValue === "string") return ruValue;

    // 3. Крайний случай: humanize ключ, чтобы НИКОГДА не показывать raw
    return humanizeKey(key);
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