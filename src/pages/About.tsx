import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FadeUp } from "@/components/animations";

export default function About() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <FadeUp>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">О проекте VaxtaGo</h1>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            VaxtaGo — AI-платформа для трудовых мигрантов. Мы объединяем поиск работы, проверку работодателей,
            перевод документов, юридическую помощь и миграционные сервисы в одном премиальном интерфейсе.
          </p>
          <p className="mt-4 text-slate-500 dark:text-slate-400">
            Основатель и автор идеи: Дмитрий Диев. Платформа создана с использованием ChatGPT.
          </p>
        </FadeUp>
      </div>
      <Footer />
    </div>
  );
}