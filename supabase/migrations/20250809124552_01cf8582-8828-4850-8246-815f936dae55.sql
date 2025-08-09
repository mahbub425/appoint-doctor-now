-- Add location field to doctor_schedules table
ALTER TABLE public.doctor_schedules 
ADD COLUMN location TEXT DEFAULT 'Karwan Bazar';

-- Add blocked field to users table  
ALTER TABLE public.users 
ADD COLUMN is_blocked BOOLEAN DEFAULT false;