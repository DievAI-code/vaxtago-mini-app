import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import en from "./locales/en.json";
import uz from "./locales/uz.json";
import uzCyr from "./locales/uz_cyr.json";

export const SUPPORTED_LANGS = ["uz", "uz_cyr", "ru", "en"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

const savedLang = (localStorage.getItem("vaxtago_language") || localStorage.getItem("vaqta_language")) as Lang;
const initialLang = SUPPORTED_LANGS.includes(savedLang) ? savedLang : "uz_cyr";

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    uz_cyr: { translation: uzCyr },
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: "uz_cyr",
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: Lang) {
  localStorage.setItem("vaxtago_language", lang);
  localStorage.setItem("vaqta_language", lang);
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang === "uz_cyr" ? "uz" : lang;
}

export default i18n;