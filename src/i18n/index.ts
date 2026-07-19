import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import uz from "./locales/uz.json";
import tg from "./locales/tg.json";
import ky from "./locales/ky.json";
import en from "./locales/en.json";

export const SUPPORTED_LANGS = ["ru", "uz", "tg", "ky", "en"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

function getInitialLang(): Lang {
  const saved = localStorage.getItem("vaxtago_language") as Lang | null;
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code?.slice(0, 2) as Lang | undefined;
  if (tgLang && SUPPORTED_LANGS.includes(tgLang)) return tgLang;
  return "ru";
}

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    uz: { translation: uz },
    tg: { translation: tg },
    ky: { translation: ky },
    en: { translation: en },
  },
  lng: getInitialLang(),
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: Lang) {
  localStorage.setItem("vaxtago_language", lang);
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
}

export default i18n;
