-- Update users table to remove email and password requirements
ALTER TABLE public.users 
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS password_hash;

-- Make auth_user_id nullable since we won't use Supabase auth for users
ALTER TABLE public.users 
ALTER COLUMN auth_user_id DROP NOT NULL;

-- Add a unique constraint on PIN for user login
ALTER TABLE public.users 
ADD CONSTRAINT users_pin_unique UNIQUE (pin);

-- Update doctors table to ensure password is visible to admin
-- No changes needed, password_hash already exists

-- Update RLS policies for PIN-based authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create new policies for PIN-based system
CREATE POLICY "Allow public read for PIN authentication" 
ON public.users 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile via PIN" 
ON public.users 
FOR UPDATE 
USING (true);

-- Update documents policies to work with PIN system
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can upload their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

CREATE POLICY "Users can view their documents" 
ON public.documents 
FOR SELECT 
USING (true);

CREATE POLICY "Users can upload documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can delete documents" 
ON public.documents 
FOR DELETE 
USING (true);

-- Update prescriptions policies
DROP POLICY IF EXISTS "Users can view their own prescriptions" ON public.prescriptions;

CREATE POLICY "Users can view prescriptions" 
ON public.prescriptions 
FOR SELECT 
USING (true);