-- Profiles table for Telegram Login (free, no SMS/password)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  first_name text,
  last_name text,
  username text,
  avatar_url text,
  language text default 'ru',
  subscription text default 'free',
  created_at timestamp default now()
);

alter table public.profiles enable row level security;

-- Allow anon to upsert their own profile by telegram_id
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (true);

create policy "Users can update their own profile" on public.profiles
  for update using (true);