-- Enable real-time for analytics tables
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.doctor_schedules REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;