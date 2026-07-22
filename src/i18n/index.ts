import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import uz from "./locales/uz.json";
import tg from "./locales/tg.json";

export const SUPPORTED_LANGS = ["ru", "uz", "tg"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

const savedLang = localStorage.getItem("vaxtago_language") as Lang;
const initialLang = SUPPORTED_LANGS.includes(savedLang) ? savedLang : "ru";

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    uz: { translation: uz },
    tg: { translation: tg },
  },
  lng: initialLang,
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: Lang) {
  localStorage.setItem("vaxtago_language", lang);
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
}

export default i18n;