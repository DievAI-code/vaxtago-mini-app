-- Migration to add missing user profile columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Ensure proper indexing for performance
CREATE INDEX IF NOT EXISTS users_phone_number_idx ON public.users (phone_number);