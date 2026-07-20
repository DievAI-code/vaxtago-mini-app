-- Unified users table for Website + Telegram Bot + Mini App
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

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();