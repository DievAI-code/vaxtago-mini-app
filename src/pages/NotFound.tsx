import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FadeUp } from "@/components/animations";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-white">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-32 text-center">
        <FadeUp>
          <div className="text-8xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">404</div>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">{t("not_found")}</p>
          <Link to="/" className="inline-block mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-semibold hover:opacity-90">
            {t("back_home")}
          </Link>
        </FadeUp>
      </div>
      <Footer />
    </div>
  );
}