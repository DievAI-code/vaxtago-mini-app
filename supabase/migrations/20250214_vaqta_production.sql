-- 1. ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    language_code TEXT DEFAULT 'ru',
    role TEXT DEFAULT 'user',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ТАБЛИЦА ПОДПИСОК
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free', -- 'free', 'premium'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'canceled'
    started_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id)
);

-- 3. ТАБЛИЦА ЛОГОВ ИСПОЛЬЗОВАНИЯ AI (для лимитов)
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL, -- 'chat', 'vision', 'translate'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ПРАВИЛА БЕЗОПАСНОСТИ (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Публичный UPSERT для авторизации
CREATE POLICY "Public upsert" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Доступ к своей подписке
CREATE POLICY "Users view own subscription" ON public.subscriptions 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 5. ОБНОВЛЕНИЕ КЭША
NOTIFY pgrst, 'reload schema';