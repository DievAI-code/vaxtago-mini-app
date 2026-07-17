import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FadeUp } from "@/components/animations";
import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <FadeUp>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{t("about")}</h1>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{t("about_text")}</p>
          <p className="mt-4 text-slate-500 dark:text-slate-400">{t("about_founder")}</p>
        </FadeUp>
      </div>
      <Footer />
    </div>
  );
}