-- Обеспечиваем наличие уникального индекса для phone_number
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_number_key'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);
    END IF;
END $$;

-- Включаем RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Политики доступа для анонимных и авторизованных пользователей
DROP POLICY IF EXISTS "Public select users" ON public.users;
CREATE POLICY "Public select users" ON public.users FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public insert users" ON public.users;
CREATE POLICY "Public insert users" ON public.users FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public update users" ON public.users;
CREATE POLICY "Public update users" ON public.users FOR UPDATE TO public USING (true) WITH CHECK (true);