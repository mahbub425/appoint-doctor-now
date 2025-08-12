-- Fix critical security vulnerability in prescriptions table
-- Drop the overly permissive policy that allows anyone to read all prescriptions
DROP POLICY IF EXISTS "Users can view prescriptions" ON public.prescriptions;

-- Create a secure policy that only allows users to view their own prescriptions
CREATE POLICY "Users can view own prescriptions" 
ON public.prescriptions 
FOR SELECT 
USING (user_id IN (
  SELECT users.id 
  FROM public.users 
  WHERE users.auth_user_id = auth.uid()
));

-- Ensure doctors can still view prescriptions for their patients (keep existing policy)
-- Note: The "Doctors can view their prescriptions" policy already exists and is secure

-- Add a comment for documentation
COMMENT ON POLICY "Users can view own prescriptions" ON public.prescriptions IS 
'Allows authenticated users to view only their own prescriptions, protecting patient privacy';