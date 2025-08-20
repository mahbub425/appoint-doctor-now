-- Add password field to users table
ALTER TABLE public.users 
ADD COLUMN password text;

-- Update existing users to have a default password (same as PIN for backwards compatibility)
UPDATE public.users 
SET password = pin 
WHERE password IS NULL;