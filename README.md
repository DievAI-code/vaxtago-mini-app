# VaxtaGo Mini App

Telegram Mini App для мигрантов — AI помощник по работе, документам и переводам.

## Технологии

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase Edge Functions (AI Router, Telegram Webhook)
- **AI:** OpenRouter (Google Gemini 2.5 Flash Vision)
- **Deploy:** Vercel (Static SPA)

## Переменные окружения (Frontend)

Скопируйте `.env.example` в `.env` и заполните:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Локальный запуск

```bash
pnpm install
pnpm run dev
```

# Vercel Deploy
Node: 24.x
pnpm: 11.13.1

Перед деплоем:
corepack enable
pnpm install

## Деплой на Vercel

См. [DEPLOYMENT.md](./DEPLOYMENT.md)

## Переменные окружения (Supabase Edge Functions)

```
OPENROUTER_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
TELEGRAM_BOT_TOKEN=...
MINI_APP_URL=https://vaxtago.vercel.app/mini/home
```

© 2026 VaxtaGo • Made by Dmitry Diev