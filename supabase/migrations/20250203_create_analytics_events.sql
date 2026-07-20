-- Analytics events table (unified schema)
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  telegram_id bigint,
  event_name text not null,
  page text,
  device text,
  browser text,
  country text,
  created_at timestamp with time zone default now()
);

alter table public.analytics_events enable row level security;

create policy "Allow anon insert analytics_events"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

create policy "Allow authenticated read analytics_events"
  on public.analytics_events
  for select
  to authenticated
  using (true);

create index if not exists idx_analytics_events_created_at on public.analytics_events (created_at);
create index if not exists idx_analytics_events_event_name on public.analytics_events (event_name);
create index if not exists idx_analytics_events_telegram_id on public.analytics_events (telegram_id);