import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FadeUp } from "@/components/animations";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <FadeUp>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Пользовательское соглашение</h1>
          <p className="mt-6 text-slate-600 dark:text-slate-300 leading-relaxed">
            Используя VaxtaGo, вы соглашаетесь с условиями предоставления сервиса. Платформа предоставляет
            информационную помощь и не гарантирует трудоустройство. За точность вакансий отвечают работодатели.
          </p>
        </FadeUp>
      </div>
      <Footer />
    </div>
  );
}