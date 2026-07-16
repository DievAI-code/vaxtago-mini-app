/*
VaxtaGo
Created by Dmitry Diev
AI Development Assistant: ChatGPT (OpenAI)
Copyright © 2026
*/

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">О VaxtaGo</h1>
          <p className="mb-6 text-xl text-gray-700">
            Платформа, которая помогает узбекским мигрантам находить работу,
            оформлять документы, проверять работодателей и оставаться в безопасности.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Наша миссия</h3>
            <p className="text-gray-600">
              Помочь мигрантам безопасно находить работу, понимать документы,
              общаться без языковых барьеров и защищать себя от мошенничества.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Ключевые функции</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• AI-ассистент на вашем языке</li>
              <li>• Поиск работы с анализом рисков</li>
              <li>• OCR и перевод документов</li>
              <li>• Проверка работодателя по ИНН/ОГРН</li>
              <li>• SOS-кнопка для экстренных ситуаций</li>
              <li>• Telegram-бот для быстрого доступа</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2026 VaxtaGo • Made by Dmitry Diev • Built with ChatGPT
          </p>
        </div>
      </div>
    </div>
  );
}