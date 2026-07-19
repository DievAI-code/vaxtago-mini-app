-- Users table for Telegram Mini App auth
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  username text,
  first_name text,
  last_name text,
  language_code text default 'ru',
  created_at timestamp with time zone default now()
);

alter table public.users enable row level security;

-- Allow anon upsert/read (Mini App client)
create policy "Allow anon upsert users"
  on public.users
  for insert
  to anon, authenticated
  with check (true);

create policy "Allow anon update users"
  on public.users
  for update
  to anon, authenticated
  using (true);

create policy "Allow anon read users"
  on public.users
  for select
  to anon, authenticated
  using (true);