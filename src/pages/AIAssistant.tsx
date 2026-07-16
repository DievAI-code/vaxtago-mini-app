/*
VaxtaGo
Created by Dmitry Diev
AI Development Assistant: ChatGPT (OpenAI)
Copyright © 2026
*/

import { AssistantConsole } from "@/components/assistant-console";

export default function AIAssistant() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-4 text-2xl font-bold text-center text-white">
          AI-ассистент VaxtaGo
        </h1>
        <p className="mb-6 text-center text-white/80">
          Задавайте вопросы о работе, документах, проверке работодателя и
          безопасности на вашем языке.
        </p>
        <AssistantConsole />
      </div>
    </div>
  );
}