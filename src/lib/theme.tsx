import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Lang = "ru" | "uz" | "tg" | "ky" | "en";

interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

const STRINGS: Record<Lang, Record<string, string>> = {
  ru: {
    tagline: "AI-помощник для мигрантов, документов и поиска работы",
    desc: "Один помощник для поиска работы, проверки работодателей, перевода документов, юридической помощи и миграционных вопросов.",
    ai: "AI Помощник",
    ai_d: "Задайте любой вопрос",
    scan: "Скан документов",
    scan_d: "OCR, распознавание, перевод",
    jobs: "Поиск работы",
    jobs_d: "Поиск вакансий, фильтры, отклик",
    employer: "Проверка работодателя",
    employer_d: "Проверить компанию, отзывы, безопасность",
    translate: "Переводчик",
    translate_d: "Русский, Узбекский, Таджикский, Кыргызский",
    lawyer: "Юрист",
    lawyer_d: "Консультации, права мигрантов, документы",
    premium: "Premium",
    premium_d: "Безлимитный AI, приоритетные вакансии",
    popular: "Популярные запросы",
    chat_ph: "Напишите сообщение...",
    about: "О проекте",
    contacts: "Контакты",
    privacy: "Политика конфиденциальности",
    terms: "Пользовательское соглашение",
  },
  uz: {
    tagline: "Migrantlar, hujjatlar va ish topish uchun AI yordamchi",
    desc: "Ish topish, ish beruvchini tekshirish, hujjatlarni tarjima qilish, yuridik yordam va migratsiya savollari uchun bitta yordamchi.",
    ai: "AI Yordamchi",
    ai_d: "Istalgan savol bering",
    scan: "Hujjatlarni skanerlash",
    scan_d: "OCR, aniqlash, tarjima",
    jobs: "Ish topish",
    jobs_d: "Vakansiyalar, filtrlar, ariza",
    employer: "Ish beruvchini tekshirish",
    employer_d: "Kompaniyani tekshirish, sharhlar, xavfsizlik",
    translate: "Tarjimon",
    translate_d: "Rus, O'zbek, Tojik, Qirg'iz",
    lawyer: "Yurist",
    lawyer_d: "Konsultatsiyalar, migrant huquqlari, hujjatlar",
    premium: "Premium",
    premium_d: "Cheksiz AI, ustuvor vakansiyalar",
    popular: "Mashhur so'rovlar",
    chat_ph: "Xabar yozing...",
    about: "Loyiha haqida",
    contacts: "Aloqa",
    privacy: "Maxfiylik siyosati",
    terms: "Foydalanish shartlari",
  },
  tg: {
    tagline: "Барои муҳоҷирон, ҳуҷҷатҳо ва ёфтани кор AI-ёрдамчӣ",
    desc: "Як ҳамдасти барои ёфтани кор, санҷиши корфармо, тарҷумаи ҳуҷҷатҳо, кумаки ҳуқуқӣ ва масъалаҳои мигратсионӣ.",
    ai: "Ёридиҳандаи AI",
    ai_d: "Ягон савол бипурсед",
    scan: "Скан кардани ҳуҷҷат",
    scan_d: "OCR, шинохтан, тарҷума",
    jobs: "Ёфтани кор",
    jobs_d: "Ҷустуҷӯи вакансия, филтрҳо, ариза",
    employer: "Санҷиши корфармо",
    employer_d: "Санҷидани ширкат, шарҳҳо, амният",
    translate: "Тарҷумон",
    translate_d: "Русӣ, Ўзбекӣ, Тоҷикӣ, Қирғизӣ",
    lawyer: "Ҳуқуқшинос",
    lawyer_d: "Маслиҳатҳо, ҳуқуқи муҳоҷирон, ҳуҷҷатҳо",
    premium: "Premium",
    premium_d: "AI-и бепоён, вакансияҳои устувор",
    popular: "Дархостҳои маъмул",
    chat_ph: "Паём нависед...",
    about: "Дар бораи лоиҳа",
    contacts: "Тамосҳо",
    privacy: "Сиёсати махфият",
    terms: "Шартҳои истифода",
  },
  ky: {
    tagline: "Мигранттар, документтер жана иш табуу үчүн AI жардамчы",
    desc: "Иш табуу, иш берүүчүнү текшерүү, документтерди которуу, юридикалык жардам жана миграциялык суроолор үчүн бир жардамчы.",
    ai: "AI Жардамчы",
    ai_d: "Кандайдыр суроо бериңиз",
    scan: "Документти сканерле",
    scan_d: "OCR, таануу, которуу",
    jobs: "Иш табуу",
    jobs_d: "Вакансиялар, фильтрлер, арыз",
    employer: "Иш берүүчүнү текшерүү",
    employer_d: "Компанияны текшерүү, пикирлер, коопсуздук",
    translate: "Котормочу",
    translate_d: "Орус, Өзбек, Тожик, Кыргыз",
    lawyer: "Юрист",
    lawyer_d: "Кеңештер, мигранттардын укугу, документтер",
    premium: "Premium",
    premium_d: "Чексиз AI, артыкчылыктуу вакансиялар",
    popular: "Белгилүү суроолор",
    chat_ph: "Билдирүү жазыңыз...",
    about: "Лоиҳа жөнүндө",
    contacts: "Байланыштар",
    privacy: "Купуялуулук саясаты",
    terms: "Колдонуу шарттары",
  },
  en: {
    tagline: "AI assistant for migrants, documents and job search",
    desc: "One assistant for job search, employer verification, document translation, legal help and migration questions.",
    ai: "AI Assistant",
    ai_d: "Ask any question",
    scan: "Document Scan",
    scan_d: "OCR, recognition, translation",
    jobs: "Job Search",
    jobs_d: "Vacancies, filters, apply",
    employer: "Employer Check",
    employer_d: "Verify company, reviews, safety",
    translate: "Translator",
    translate_d: "Russian, Uzbek, Tajik, Kyrgyz",
    lawyer: "Lawyer",
    lawyer_d: "Consultations, migrant rights, documents",
    premium: "Premium",
    premium_d: "Unlimited AI, priority jobs",
    popular: "Popular requests",
    chat_ph: "Type a message...",
    about: "About",
    contacts: "Contacts",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
  },
};

export function useStrings() {
  const { lang } = useApp();
  return STRINGS[lang];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem("vaxtago_lang") as Lang) || "ru",
  );
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("vaxtago_theme") as "light" | "dark") || "light",
  );

  useEffect(() => {
    localStorage.setItem("vaxtago_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("vaxtago_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang: setLangState,
        theme,
        toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}