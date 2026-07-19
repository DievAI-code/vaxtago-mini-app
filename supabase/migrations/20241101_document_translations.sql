-- Таблица истории переводов документов
create table if not exists public.document_translations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  telegram_id bigint,
  image_url text,
  original_text text,
  translated_text text,
  created_at timestamptz default now()
);

alter table public.document_translations enable row level security;

create policy "Allow anon insert" on public.document_translations
  for insert to anon, authenticated with check (true);

create policy "Allow anon select own" on public.document_translations
  for select to anon, authenticated using (true);