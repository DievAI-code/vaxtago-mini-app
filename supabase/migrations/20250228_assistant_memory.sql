create table if not exists public.assistant_memory (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  memory_key text not null,
  memory_value text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Fast lookup index
create index if not exists idx_assistant_memory_user_key 
  on public.assistant_memory(user_id, memory_key);

-- Enable RLS
alter table public.assistant_memory enable row level security;

-- Authenticated users manage their own memory
create policy "Users can manage own memory"
  on public.assistant_memory
  for all
  to authenticated
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- Anon fallback for Mini App compatibility (recommend tightening in production)
create policy "Allow anon access"
  on public.assistant_memory
  for all
  to anon
  using (true)
  with check (true);