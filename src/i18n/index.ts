import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import en from "./locales/en.json";
import uz_lat from "./locales/uz_lat.json";
import uz_cyr from "./locales/uz_cyr.json";

export const SUPPORTED_LANGS = ["ru", "uz_lat", "uz_cyr", "en"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

function readSavedLang(): Lang {
  try {
    const raw = (localStorage.getItem("vaxtago_language") || localStorage.getItem("vaqta_language") || "") as string;
    
    // Маппинг старых кодов на новые
    if (raw === "uz") return "uz_lat";
    if (raw === "uz_cyr") return "uz_cyr";
    
    if (SUPPORTED_LANGS.includes(raw as Lang)) return raw as Lang;
  } catch { /* ignore */ }
  return "ru";
}

const initialLang = readSavedLang();

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    uz_lat: { translation: uz_lat },
    uz_cyr: { translation: uz_cyr },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export function setLanguage(lang: Lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  
  // Сохраняем в старых и новых ключах для совместимости
  localStorage.setItem("vaxtago_language", lang);
  localStorage.setItem("vaqta_language", lang);
  
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang.startsWith("uz") ? "uz" : lang;
}

export default i18n;