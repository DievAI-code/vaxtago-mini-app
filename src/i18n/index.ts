import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import en from "./locales/en.json";
import kk from "./locales/kk.json";
import uz from "./locales/uz.json";

export const SUPPORTED_LANGS = ["ru", "uz", "kk", "en"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

const savedLang = (localStorage.getItem("vaxtago_language") || localStorage.getItem("vaqta_language")) as Lang;
const initialLang = SUPPORTED_LANGS.includes(savedLang) ? savedLang : "ru";

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    uz: { translation: uz },
    kk: { translation: kk },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: Lang) {
  localStorage.setItem("vaxtago_language", lang);
  localStorage.setItem("vaqta_language", lang);
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
}

export default i18n;