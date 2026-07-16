-- ============================================================
-- VaxtaGo Telegram Bot — Database Schema
-- Run this in the Supabase SQL editor.
-- ============================================================

-- Telegram users (linked to auth.users when phone is confirmed)
CREATE TABLE IF NOT EXISTS public.telegram_users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  phone TEXT,
  full_name TEXT,
  language TEXT NOT NULL DEFAULT 'ru',
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.telegram_users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.telegram_users TO authenticated;

CREATE POLICY "telegram_users_service_all" ON public.telegram_users
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "telegram_users_authenticated_own" ON public.telegram_users
  FOR ALL TO authenticated USING (linked_user_id = auth.uid()) WITH CHECK (linked_user_id = auth.uid());

-- Favorites (vacancies / employers)
CREATE TABLE IF NOT EXISTS public.favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id BIGINT,
  item_type TEXT NOT NULL CHECK (item_type IN ('vacancy', 'employer')),
  item_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.favorites TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.favorites TO authenticated;

CREATE POLICY "favorites_service_all" ON public.favorites
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "favorites_authenticated_own" ON public.favorites
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id BIGINT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated;

CREATE POLICY "notifications_service_all" ON public.notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "notifications_authenticated_own" ON public.notifications
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Storage bucket for user documents (create via dashboard or SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;