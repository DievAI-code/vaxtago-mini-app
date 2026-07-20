-- Users table for Telegram authentication
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  phone_number text,
  language_code text default 'ru',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id);

create index if not exists idx_users_telegram_id on public.users (telegram_id);