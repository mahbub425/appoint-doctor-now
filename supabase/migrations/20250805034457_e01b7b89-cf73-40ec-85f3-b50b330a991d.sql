-- Fix RLS policies for doctors table to allow admin operations

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow public view of active doctors" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can update their own profile" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can view their own profile" ON public.doctors;

-- Create new policies for admin operations and public viewing
CREATE POLICY "Allow public insert access to doctors" 
ON public.doctors 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to doctors" 
ON public.doctors 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to doctors" 
ON public.doctors 
FOR DELETE 
USING (true);

CREATE POLICY "Allow public read access to doctors" 
ON public.doctors 
FOR SELECT 
USING (true);