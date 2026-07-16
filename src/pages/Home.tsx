/*
VaxtaGo
Created by Dmitry Diev
AI Development Assistant: ChatGPT (OpenAI)
Copyright © 2026
*/

import { useNavigate } from "react-router-dom";
import { Bot, FileText, Briefcase, User } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  const buttons = [
    { icon: Bot, label: "🤖 AI помощник", path: "/chat", color: "from-blue-500 to-cyan-500" },
    { icon: FileText, label: "📷 Документы", path: "/scanner", color: "from-purple-500 to-pink-500" },
    { icon: Briefcase, label: "💼 Работа", path: "/jobs", color: "from-green-500 to-emerald-500" },
    { icon: User, label: "👤 Профиль", path: "/profile", color: "from-orange-500 to-amber-500" },
  ];

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

        <div className="grid gap-4">
          {buttons.map((btn) => (
            <button
              key={btn.path}
              onClick={() => navigate(btn.path)}
              className={`flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${btn.color} text-white shadow-lg hover:scale-105 transition-transform`}
            >
              <btn.icon size={28} />
              <span className="text-lg font-semibold">{btn.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2026 VaxtaGo • Made by Dmitry Diev</p>
        </div>
      </div>
    </div>
  );
}