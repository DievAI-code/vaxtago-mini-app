-- Telegram users table for bot-based authentication
CREATE TABLE IF NOT EXISTS public.telegram_users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT DEFAULT 'ru',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON public.telegram_users (telegram_id);

-- Enable RLS (we use service role from Edge Functions, but keep table protected)
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

-- Allow anon to read (needed for Mini App profile display via PostgREST if used)
-- In production, restrict to authenticated or use Edge Function with service role
CREATE POLICY "Allow anon read telegram_users" ON public.telegram_users
  FOR SELECT TO anon USING (true);

-- Allow anon insert/update (Edge Function uses service role, but bot python also uses anon key)
CREATE POLICY "Allow anon write telegram_users" ON public.telegram_users
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update telegram_users" ON public.telegram_users
  FOR UPDATE TO anon USING (true);