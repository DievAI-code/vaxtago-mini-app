/*
VaxtaGo
Created by Dmitry Diev
AI Development Assistant: ChatGPT (OpenAI)
Copyright © 2026
*/

import { TelegramCard } from "@/components/telegram-card";

export default function TelegramBot() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="mb-4 text-2xl font-bold text-center text-white">
          VaxtaGo Telegram Bot
        </h1>
        <p className="mb-6 text-center text-white/80">
          Общайтесь с нашим ботом в Telegram, используя те же функции AI-
          ассистентa, что и в веб-приложении.
        </p>
        <TelegramCard />
        <div className="mt-8 text-center text-white/70">
          <p>
            Найдите бота в Telegram: <code>@VaxtaGO_bot</code> или перейдите по
            ссылке выше.
          </p>
          <p className="mt-2">
            Бот поддерживает команды: <code>/start</code>, <code>/help</code>,
            <code>/jobs</code>, <code>/docs</code>, <code>/mvd</code>,
            <code>/sos</code> и свободный текст на русском, узбекском,
            таджикском, кыргызском и английском.
          </p>
        </div>
      </div>
    </div>
  );
}