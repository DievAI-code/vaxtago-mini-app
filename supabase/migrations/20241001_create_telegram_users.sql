-- Create telegram_users table for VaxtaGo bot
CREATE TABLE IF NOT EXISTS public.telegram_users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  username text,
  first_name text,
  language text default 'ru',
  subscription_status text default 'FREE',
  created_at timestamp default now(),
  last_activity timestamp default now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON public.telegram_users (telegram_id);