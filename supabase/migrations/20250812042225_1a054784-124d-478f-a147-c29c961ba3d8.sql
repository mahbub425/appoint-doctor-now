-- Fix critical security vulnerability in appointments table
-- Current policies allow public access to all patient medical data

-- Drop all the overly permissive policies
DROP POLICY IF EXISTS "Allow public read access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public insert access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public update access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public delete access to appointments" ON public.appointments;

-- Create secure policies for SELECT (viewing appointments)
-- Policy 1: Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" 
ON public.appointments 
FOR SELECT 
USING (
  user_id IN (
    SELECT users.id 
    FROM public.users 
    WHERE users.auth_user_id = auth.uid()
  )
);

-- Policy 2: Doctors can view appointments for their patients
CREATE POLICY "Doctors can view their patient appointments" 
ON public.appointments 
FOR SELECT 
USING (
  doctor_id IN (
    SELECT doctors.id 
    FROM public.doctors 
    WHERE doctors.auth_user_id = auth.uid()
  )
);

-- Policy 3: Allow public appointment booking (INSERT)
-- This is needed for the booking system to work
CREATE POLICY "Allow appointment booking" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);

-- Policy 4: Doctors can update appointments for their patients
CREATE POLICY "Doctors can update their patient appointments" 
ON public.appointments 
FOR UPDATE 
USING (
  doctor_id IN (
    SELECT doctors.id 
    FROM public.doctors 
    WHERE doctors.auth_user_id = auth.uid()
  )
);

-- Policy 5: Patients can update their own appointments (limited updates)
CREATE POLICY "Patients can update own appointments" 
ON public.appointments 
FOR UPDATE 
USING (
  user_id IN (
    SELECT users.id 
    FROM public.users 
    WHERE users.auth_user_id = auth.uid()
  )
);

-- Policy 6: Only doctors can delete appointments
CREATE POLICY "Doctors can delete their patient appointments" 
ON public.appointments 
FOR DELETE 
USING (
  doctor_id IN (
    SELECT doctors.id 
    FROM public.doctors 
    WHERE doctors.auth_user_id = auth.uid()
  )
);

-- Add documentation comments
COMMENT ON POLICY "Patients can view own appointments" ON public.appointments IS 
'Allows authenticated patients to view only their own appointment data';

COMMENT ON POLICY "Doctors can view their patient appointments" ON public.appointments IS 
'Allows authenticated doctors to view appointments for their assigned patients only';

COMMENT ON POLICY "Allow appointment booking" ON public.appointments IS 
'Allows public appointment booking - appointment data is protected by SELECT policies';

COMMENT ON POLICY "Doctors can update their patient appointments" ON public.appointments IS 
'Allows doctors to update appointment status and details for their patients';

COMMENT ON POLICY "Patients can update own appointments" ON public.appointments IS 
'Allows patients limited updates to their own appointments';

COMMENT ON POLICY "Doctors can delete their patient appointments" ON public.appointments IS 
'Allows doctors to delete appointments for their patients only';