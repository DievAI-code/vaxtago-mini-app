import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            VaxtaGo — ваш AI-ассистент для успешной работы в России
          </h1>
          <p className="mb-6 text-xl text-gray-700">
            Платформа, которая помогает узбекским мигрантам находить работу,
            оформлять документы, проверять работодателей и оставаться в
            безопасности.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/mini/home"
              className="flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <span className="mr-2">🚀</span>
              Открыть Mini App
            </Link>
            <Link
              to="/ai-assistant"
              className="flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <span className="mr-2">🤖</span>
              AI-ассистент
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">💼 Поиск работы</h3>
            <p className="text-gray-600">
              Подбор вакансий с анализом зарплаты, рисков и реального дохода.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">📄 Документы</h3>
            <p className="text-gray-600">
              OCR и перевод паспортов, виз, трудовых договоров.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">🛡️ Безопасность</h3>
            <p className="text-gray-600">
              Проверка работодателя по ИНН/ОГРН, SOS-кнопка.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Начать работу
          </a>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2026 VaxtaGo • Made by Dmitry Diev • Built with ChatGPT
          </p>
        </div>
      </div>
    </div>
  );
}