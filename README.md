# VAQTA AI Mini App

Telegram Mini App для мигрантов — AI помощник по работе, документам и переводам.

## Технологии

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase Edge Functions (AI Router, Telegram Webhook)
- **AI:** OpenRouter (Google Gemini 2.5 Flash Vision)
- **Maps:** Yandex Maps API v3 (with OpenStreetMap fallback)
- **Deploy:** Vercel (Static SPA)

## Переменные окружения (Frontend)

Скопируйте `.env.example` в `.env` и заполните:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Yandex Maps API Keys (Optional but recommended)
# Get them at: https://developer.tech.yandex.ru/
VITE_YANDEX_MAPS_API_KEY=your-maps-key
VITE_YANDEX_GEOCODER_API_KEY=your-geocoder-key

# Admin
VITE_ADMIN_PASSWORD=31975
```

> **Note:** If Yandex keys are missing, the app will automatically fallback to OpenStreetMap (Nominatim) for search and routing.

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

© 2026 VAQTA AI • Made by Dmitry Diev