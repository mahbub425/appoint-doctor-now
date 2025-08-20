
-- Add DELETE policy for doctor_schedules table
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public delete access to doctor_schedules" 
ON public.doctor_schedules 
FOR DELETE 
USING (true);
