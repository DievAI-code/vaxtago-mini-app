import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FadeUp } from "@/components/animations";
import { VaxtaGoLogo } from "@/components/VaxtaGoLogo";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <FadeUp>
          <div className="text-center">
            <VaxtaGoLogo size={64} className="mx-auto mb-6" />
            <div className="text-8xl font-black bg-gradient-to-r from-[#2563EB] to-[#14B8A6] bg-clip-text text-transparent">404</div>
            <p className="mt-4 text-lg text-slate-400">{t("not_found")}</p>
            <Link to="/" className="inline-block mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#14B8A6] text-white font-semibold hover:opacity-90">
              {t("back_home")}
            </Link>
          </div>
        </FadeUp>
      </div>
      <Footer />
    </div>
  );
}