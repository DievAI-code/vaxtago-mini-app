import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FadeUp } from "@/components/animations";
import { Mail, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Contacts() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <FadeUp>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{t("contacts")}</h1>
          <div className="mt-8 space-y-4">
            <a href="mailto:hello@vaxtago.app" className="flex items-center gap-3 p-4 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <Mail className="text-blue-600" /> {t("contacts_email")}
            </a>
            <a href="https://t.me/VaxtaGO_bot" className="flex items-center gap-3 p-4 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <Send className="text-blue-600" /> {t("contacts_bot")}
            </a>
          </div>
        </FadeUp>
      </div>
      <Footer />
    </div>
  );
}