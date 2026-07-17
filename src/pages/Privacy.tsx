import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FadeUp } from "@/components/animations";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <FadeUp>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Политика конфиденциальности</h1>
          <p className="mt-6 text-slate-600 dark:text-slate-300 leading-relaxed">
            VaxtaGo уважает приватность пользователей. Мы не передаем персональные данные третьим лицам без согласия.
            Все AI-запросы обрабатываются через защищенные Edge Functions. Данные документов хранятся в зашифрованном виде.
          </p>
        </FadeUp>
      </div>
      <Footer />
    </div>
  );
}