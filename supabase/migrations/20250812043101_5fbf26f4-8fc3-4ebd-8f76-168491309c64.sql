-- Fix user registration RLS policy issue
-- The current policy may not be working correctly for user signup

-- Drop existing INSERT policy for users table
DROP POLICY IF EXISTS "Allow public signup" ON public.users;

-- Recreate the policy to allow public user registration
CREATE POLICY "Allow public signup" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Ensure the policy allows both authenticated and unauthenticated users to insert
-- This is necessary for the signup process to work
COMMENT ON POLICY "Allow public signup" ON public.users IS 
'Allows anyone to create a new user account during registration';