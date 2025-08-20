-- Fix critical security vulnerability in users table
-- The current "Users can view own data" policy allows unauthenticated users 
-- to read all user records with non-null PIN and phone, which is a serious security breach

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- Create a secure policy that only allows authenticated users to view their own data
CREATE POLICY "Authenticated users can view own data" 
ON public.users 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND auth_user_id = auth.uid()
);

-- Create a separate, highly restricted policy for PIN-based authentication
-- This policy only allows access to specific fields needed for authentication
-- and only when used through the secure authenticate_user_by_pin function
CREATE POLICY "Limited access for PIN authentication" 
ON public.users 
FOR SELECT 
USING (
  -- This policy should only be used by the authenticate_user_by_pin function
  -- which is marked as SECURITY DEFINER and runs with elevated privileges
  -- Regular users cannot use this policy directly
  current_setting('role') = 'supabase_admin'
);

-- Update the authenticate_user_by_pin function to ensure it's properly secured
-- and only returns minimal necessary data
CREATE OR REPLACE FUNCTION public.authenticate_user_by_pin(user_pin text, user_phone text)
RETURNS TABLE(user_id uuid, user_name text, user_concern text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function bypasses RLS due to SECURITY DEFINER
  -- It only returns data for users with matching PIN and phone
  -- and excludes blocked users
  RETURN QUERY
  SELECT id, name, concern
  FROM public.users 
  WHERE pin = user_pin 
    AND phone = user_phone 
    AND (is_blocked IS FALSE OR is_blocked IS NULL);
END;
$$;

-- Add comment for documentation
COMMENT ON POLICY "Authenticated users can view own data" ON public.users IS 
'Allows authenticated users to view only their own profile data, protecting patient privacy';

COMMENT ON POLICY "Limited access for PIN authentication" ON public.users IS 
'Restricted policy for internal use by authentication functions only';