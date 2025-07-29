-- Create doctor_schedules table
CREATE TABLE public.doctor_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  availability_date DATE NOT NULL UNIQUE,
  start_time TIME NOT NULL DEFAULT '11:00:00',
  break_start TIME NOT NULL DEFAULT '13:15:00',
  break_end TIME NOT NULL DEFAULT '14:30:00',
  end_time TIME NOT NULL DEFAULT '16:30:00',
  max_appointments INTEGER NOT NULL DEFAULT 17,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pin INTEGER NOT NULL,
  concern TEXT NOT NULL CHECK (concern IN ('OPL', 'OG', 'Udvash', 'Rokomari', 'Unmesh', 'Uttoron')),
  phone TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('New Patient', 'Follow Up', 'Report Show')),
  appointment_date DATE NOT NULL,
  serial_number INTEGER NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'current', 'completed', 'absent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pin, appointment_date),
  UNIQUE(appointment_date, serial_number)
);

-- Enable Row Level Security
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public booking system)
CREATE POLICY "Allow public read access to doctor_schedules" 
ON public.doctor_schedules 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to appointments" 
ON public.appointments 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to appointments" 
ON public.appointments 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public insert access to doctor_schedules" 
ON public.doctor_schedules 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to doctor_schedules" 
ON public.doctor_schedules 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to appointments" 
ON public.appointments 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_doctor_schedules_updated_at
  BEFORE UPDATE ON public.doctor_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for appointments table
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.appointments;