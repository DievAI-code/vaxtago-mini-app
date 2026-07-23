-- Добавляем нужные поля в таблицу users
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'ru',
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Создаем таблицу разрешений пользователей для управления функциями
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  phone_number TEXT,
  feature_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_feature UNIQUE(user_id, feature_name)
);

-- Включаем RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select permissions" ON public.user_permissions;
CREATE POLICY "Public select permissions" ON public.user_permissions FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public manage permissions" ON public.user_permissions;
CREATE POLICY "Public manage permissions" ON public.user_permissions FOR ALL TO public USING (true) WITH CHECK (true);