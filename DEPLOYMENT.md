# VaxtaGo Mini App — Деплой на Vercel

## Подготовка

Проект готов к деплою как статический SPA (React + Vite).

## Шаг 1: Push в GitHub

```bash
git add .
git commit -m "VaxtaGo Mini App for Vercel"
git push origin main
```

## Шаг 2: Импорт в Vercel

1. Зайдите на [vercel.com](https://vercel.com)
2. Нажмите **Add New → Project**
3. Импортируйте репозиторий с проектом
4. Framework Preset: **Vite**
5. Build Command: `vite build`
6. Output Directory: `dist`

## Шаг 3: Переменные окружения (необязательно для фронта)

Для фронтенда переменные берутся из `src/integrations/supabase/client.ts`.
Если нужно переопределить:

```
VITE_SUPABASE_URL=https://watkanjjfsvqbhebchpk.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Шаг 4: Deploy

Нажмите **Deploy**. Через 1–2 минуты получите HTTPS:

```
https://vaxtago.vercel.app
```

## Шаг 5: Подключение в BotFather

1. Откройте @BotFather в Telegram
2. `/setmenubutton` → выберите бот → URL: `https://vaxtago.vercel.app/mini/home`
3. Или `/setcommands` для команды `/start` с Web App

## Шаг 6: Настройка Mini App URL в Supabase

В `supabase/functions/telegram-webhook/handlers.ts` уже указано:

```ts
const MINI_APP_URL = Deno.env.get("MINI_APP_URL") ?? "https://vaxtago.vercel.app/mini/home";
```

Убедитесь, что в Supabase Edge Function переменная `MINI_APP_URL=https://vaxtago.vercel.app/mini/home` установлена.

## Проверка

Откройте `https://vaxtago.vercel.app/mini/home` в браузере — должен появиться экран VaxtaGo с кнопками.

## Структура

- `src/pages/Home.tsx` — главный экран
- `src/pages/Chat.tsx` — AI чат
- `src/pages/Scanner.tsx` — сканер документов
- `src/pages/Jobs.tsx` — вакансии
- `src/pages/Profile.tsx` — профиль
- `supabase/functions/ai-router/` — единый AI Router (Gemini Vision)

© 2026 VaxtaGo • Made by Dmitry Diev