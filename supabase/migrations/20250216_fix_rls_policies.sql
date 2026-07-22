-- Включаем RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Политика: разрешить SELECT своих данных
CREATE POLICY "Users can view own data" ON public.users
FOR SELECT USING (
  auth.uid()::text = id OR 
  phone_number = current_setting('request.jwt.claims', true)::json->>'phone'
);

-- Политика: разрешить INSERT новых пользователей
CREATE POLICY "Allow anonymous user registration" ON public.users
FOR INSERT WITH CHECK (true);

-- Политика: разрешить UPDATE своих данных
CREATE POLICY "Users can update own data" ON public.users
FOR UPDATE USING (
  auth.uid()::text = id OR 
  phone_number = current_setting('request.jwt.claims', true)::json->>'phone'
);

-- Даем права anon роли
GRANT SELECT, INSERT, UPDATE ON public.users TO anon;
GRANT USAGE ON SEQUENCE users_id_seq TO anon;