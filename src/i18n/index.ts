import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import en from "./locales/en.json";
import uz from "./locales/uz.json";
import uz_cyr from "./locales/uz_cyr.json";

export const SUPPORTED_LANGS = ["uz", "uz_cyr", "ru", "en"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

function readSavedLang(): Lang {
  try {
    const raw = (localStorage.getItem("vaxtago_language") || localStorage.getItem("vaqta_language") || "") as string;
    if (SUPPORTED_LANGS.includes(raw as Lang)) return raw as Lang;
  } catch { /* ignore */ }
  return "ru";
}

const initialLang = readSavedLang();

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    uz_cyr: { translation: uz_cyr },
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
  // Если ключа нет — возвращаем строку ключа, но LanguageProvider.safeT
  // перехватывает и подменяет через ruLocale / humanize.
  returnEmptyString: false,
});

export function setLanguage(lang: Lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  localStorage.setItem("vaxtago_language", lang);
  localStorage.setItem("vaqta_language", lang);
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang.startsWith("uz") ? "uz" : lang;
}

export default i18n;