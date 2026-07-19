/*
VaxtaGo
Created by Dmitry Diev
AI Development Assistant: ChatGPT (OpenAI)
Copyright © 2026
*/

import { useNavigate } from "react-router-dom";
import { Bot } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            VaxtaGo
          </h1>
          <p className="text-gray-600 mt-2">
            AI помощник для работы и документов
          </p>
        </div>

        <button
          onClick={() => navigate("/chat")}
          className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:scale-105 transition-transform w-full"
        >
          <Bot size={32} />
          <span className="text-xl font-semibold">💬 AI Помощник</span>
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Просто напишите сообщение — я сам определю: поиск работы, перевод, документы, работодатель, юрист или миграция.
        </p>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2026 VaxtaGo • Made by Dmitry Diev</p>
        </div>
      </div>
    </div>
  );
}
