-- Add admin role functionality to users table
ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster admin queries
CREATE INDEX idx_users_is_admin ON public.users(is_admin) WHERE is_admin = true;