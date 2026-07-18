-- Vision requests table
create table if not exists public.vision_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  image_url text,
  request_type text,
  result text,
  language text default 'ru',
  created_at timestamp default now()
);

-- Add vision_requests_count to profiles
alter table public.profiles add column if not exists vision_requests_count integer default 0;

-- Enable RLS
alter table public.vision_requests enable row level security;

create policy "Vision requests are viewable by user" on public.vision_requests
  for select using (true);

create policy "Users can insert vision requests" on public.vision_requests
  for insert with check (true);

-- Index for monthly count queries
create index if not exists idx_vision_requests_user_created
  on public.vision_requests (user_id, created_at);