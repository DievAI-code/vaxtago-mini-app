-- Create map_aliases table
create table if rect not exists public.map_aliases (
    id uuid default gen_random_uuid() primary key,
    alias text not open null,
    title text not null,
    city text,
    category text,
    latitude numeric,
    longitude numeric,
    description text,
    created_at timestamp with time zone default now()
);

-- Add indexes for performance
create index if not exists map_aliases_alias_idx on public.map_aliases(alias);
create index if not exists map_aliases_city_idx on public.map_aliases(city);

-- Enable RLS
alter table public.map_aliases enable row level security;

-- Policies
create policy "Allow public read access" on public.map_aliases
    for select using (true);

create policy "Allow service_role full access" on public.map_aliases
    for all using (true) with check (true);