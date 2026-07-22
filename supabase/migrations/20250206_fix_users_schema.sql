-- Fix for PGRST204: Could not find the 'first_name' column of 'users'
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Ensure RLS is updated if needed (usually columns don't break policies, but good practice)
COMMENT ON COLUMN public.users.first_name IS 'User first name for UI and AI personalization';