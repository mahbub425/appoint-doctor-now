-- Create users table for patient authentication
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  pin text NOT NULL UNIQUE,
  concern text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE,
  password_hash text,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  degree text NOT NULL,
  experience text NOT NULL,
  designation text,
  specialties text[],
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create documents table for medical history
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create prescriptions table for consultation notes
CREATE TABLE public.prescriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  consultation_notes text,
  prescription_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Update appointments table to include user_id and doctor_id
ALTER TABLE public.appointments 
ADD COLUMN user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
ADD COLUMN doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE;

-- Update doctor_schedules table to include doctor_id
ALTER TABLE public.doctor_schedules 
ADD COLUMN doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE;

-- Enable RLS on all new tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_user_id);
  
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Allow public signup" ON public.users
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for doctors table
CREATE POLICY "Doctors can view their own profile" ON public.doctors
  FOR SELECT USING (auth.uid() = auth_user_id);
  
CREATE POLICY "Doctors can update their own profile" ON public.doctors
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Allow public view of active doctors" ON public.doctors
  FOR SELECT USING (is_active = true);

-- Create RLS policies for documents table
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
  
CREATE POLICY "Users can upload their own documents" ON public.documents
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
  
CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Create RLS policies for prescriptions table
CREATE POLICY "Users can view their own prescriptions" ON public.prescriptions
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
  
CREATE POLICY "Doctors can view their prescriptions" ON public.prescriptions
  FOR SELECT USING (doctor_id IN (SELECT id FROM public.doctors WHERE auth_user_id = auth.uid()));
  
CREATE POLICY "Doctors can create prescriptions" ON public.prescriptions
  FOR INSERT WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE auth_user_id = auth.uid()));
  
CREATE POLICY "Doctors can update their prescriptions" ON public.prescriptions
  FOR UPDATE USING (doctor_id IN (SELECT id FROM public.doctors WHERE auth_user_id = auth.uid()));

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample doctors
INSERT INTO public.doctors (name, degree, experience, designation, specialties, username, password_hash) VALUES
(
  'Dr. Md. Shojib Hossen Sipo',
  'MBBS, FCGP, MPH, DUMS (DU), Diploma in Asthma (UK), CCD (BIRDEM), PG Diploma in Diabetes (UK)',
  'Ex-Lec. Shaheed Monsur Ali Medical College and Hospital',
  'EMO, Medical College For Women and Hospital',
  ARRAY['General Medicine', 'Diabetes', 'Asthma'],
  'dr_shojib',
  '$2b$10$dummy_hash_for_shojib123'
),
(
  'Dr. Ayesha Rahman',
  'MBBS, FCPS (Pediatrics), MD (Child Health)',
  '12 years in Pediatric Care',
  'Consultant, Dhaka Children''s Hospital',
  ARRAY['Pediatrics', 'Child Health'],
  'dr_ayesha',
  '$2b$10$dummy_hash_for_ayesha456'
),
(
  'Dr. Kamrul Hasan',
  'MBBS, MS (Orthopedics), Fellowship in Joint Replacement (India)',
  '15 years in Orthopedic Surgery',
  'Senior Consultant, Orthopedic Department, Apollo Hospital',
  ARRAY['Orthopedics', 'Joint Replacement'],
  'dr_kamrul',
  '$2b$10$dummy_hash_for_kamrul789'
);

-- Update existing doctor_schedules to reference the first doctor
UPDATE public.doctor_schedules 
SET doctor_id = (SELECT id FROM public.doctors WHERE username = 'dr_shojib' LIMIT 1)
WHERE doctor_id IS NULL;