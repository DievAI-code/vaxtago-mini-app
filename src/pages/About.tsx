import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { FadeUp } from "@/components/animations";
import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-white">
      <div className="flex-shrink-0"><Navbar /></div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <FadeUp>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{t("about")}</h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{t("about_text")}</p>
            <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-blue-600/10 to-cyan-400/10 border border-blue-200 dark:border-blue-800">
              <p className="text-slate-700 dark:text-slate-200 font-semibold">VaxtaGo</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Founded by</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">Диев Дмитрий Сергеевич</p>
              <p className="text-sm text-slate-400 mt-2">© 2026 VaxtaGo</p>
            </div>
          </FadeUp>
        </div>
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}