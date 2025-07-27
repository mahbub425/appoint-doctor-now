-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  concern TEXT NOT NULL,
  reason TEXT NOT NULL,
  contact TEXT NOT NULL,
  serial INTEGER NOT NULL,
  time TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_absent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctor timings table
CREATE TABLE public.doctor_timings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_time TEXT NOT NULL DEFAULT '11:00',
  break_start TEXT NOT NULL DEFAULT '13:15',
  break_end TEXT NOT NULL DEFAULT '14:30',
  end_time TEXT NOT NULL DEFAULT '16:30',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default doctor timings
INSERT INTO public.doctor_timings (start_time, break_start, break_end, end_time)
VALUES ('11:00', '13:15', '14:30', '16:30');

-- Enable Row Level Security (making data public for this use case)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_timings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is for company employees)
CREATE POLICY "Appointments are publicly accessible" 
ON public.appointments 
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Doctor timings are publicly accessible" 
ON public.doctor_timings 
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_appointments_pin_date ON public.appointments(pin, date);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_timings_updated_at
  BEFORE UPDATE ON public.doctor_timings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();