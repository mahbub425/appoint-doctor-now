-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  doctor_id UUID,
  admin_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (
  (user_id IS NOT NULL AND auth.uid()::text IN (SELECT auth_user_id::text FROM users WHERE id = user_id))
  OR (doctor_id IS NOT NULL AND auth.uid() IN (SELECT auth_user_id FROM doctors WHERE id = doctor_id))
  OR (admin_id IS NOT NULL AND auth.uid()::text = admin_id::text)
);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their notification read status" 
ON public.notifications 
FOR UPDATE 
USING (
  (user_id IS NOT NULL AND auth.uid()::text IN (SELECT auth_user_id::text FROM users WHERE id = user_id))
  OR (doctor_id IS NOT NULL AND auth.uid() IN (SELECT auth_user_id FROM doctors WHERE id = doctor_id))
  OR (admin_id IS NOT NULL AND auth.uid()::text = admin_id::text)
);

-- Add trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to send schedule change notifications
CREATE OR REPLACE FUNCTION public.notify_schedule_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  doctor_record RECORD;
  affected_users RECORD;
BEGIN
  -- Get doctor details
  SELECT name INTO doctor_record FROM public.doctors WHERE id = NEW.doctor_id;
  
  -- Notify doctor about schedule changes
  INSERT INTO public.notifications (doctor_id, type, title, message, metadata)
  VALUES (
    NEW.doctor_id,
    'schedule_updated',
    'Schedule Updated',
    'Your schedule for ' || NEW.availability_date || ' has been updated by admin.',
    jsonb_build_object('schedule_id', NEW.id, 'date', NEW.availability_date)
  );
  
  -- Notify affected users with appointments on this date
  FOR affected_users IN 
    SELECT DISTINCT u.id as user_id, u.name as user_name, a.appointment_time, a.id as appointment_id
    FROM public.appointments a
    JOIN public.users u ON a.user_id = u.id
    WHERE a.doctor_id = NEW.doctor_id 
    AND a.appointment_date = NEW.availability_date
    AND a.status = 'upcoming'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      affected_users.user_id,
      'schedule_changed',
      'Appointment Time Updated',
      'Your appointment with Dr. ' || doctor_record.name || ' on ' || NEW.availability_date || ' has been rescheduled due to doctor''s schedule change.',
      jsonb_build_object(
        'appointment_id', affected_users.appointment_id,
        'doctor_name', doctor_record.name,
        'date', NEW.availability_date,
        'old_time', OLD.start_time,
        'new_time', NEW.start_time
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for schedule changes
CREATE TRIGGER notify_schedule_changes_trigger
AFTER UPDATE ON public.doctor_schedules
FOR EACH ROW
WHEN (OLD.start_time IS DISTINCT FROM NEW.start_time OR OLD.end_time IS DISTINCT FROM NEW.end_time)
EXECUTE FUNCTION public.notify_schedule_changes();

-- Create function to notify new appointments
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  doctor_record RECORD;
  user_record RECORD;
BEGIN
  -- Get doctor and user details
  SELECT name INTO doctor_record FROM public.doctors WHERE id = NEW.doctor_id;
  SELECT name INTO user_record FROM public.users WHERE id = NEW.user_id;
  
  -- Notify doctor about new appointment
  INSERT INTO public.notifications (doctor_id, type, title, message, metadata)
  VALUES (
    NEW.doctor_id,
    'new_appointment',
    'New Appointment Booked',
    user_record.name || ' has booked an appointment for ' || NEW.appointment_date || ' at ' || NEW.appointment_time,
    jsonb_build_object(
      'appointment_id', NEW.id,
      'patient_name', user_record.name,
      'date', NEW.appointment_date,
      'time', NEW.appointment_time
    )
  );
  
  -- Notify admin about new appointment (assuming there's an admin user)
  INSERT INTO public.notifications (admin_id, type, title, message, metadata)
  VALUES (
    '00000000-0000-0000-0000-000000000000', -- placeholder admin ID
    'new_appointment',
    'New Appointment Booked',
    user_record.name || ' booked appointment with Dr. ' || doctor_record.name || ' for ' || NEW.appointment_date,
    jsonb_build_object(
      'appointment_id', NEW.id,
      'patient_name', user_record.name,
      'doctor_name', doctor_record.name,
      'date', NEW.appointment_date,
      'time', NEW.appointment_time
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new appointments
CREATE TRIGGER notify_new_appointment_trigger
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_appointment();

-- Create function to notify new user registration
CREATE OR REPLACE FUNCTION public.notify_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Notify admin about new user registration
  INSERT INTO public.notifications (admin_id, type, title, message, metadata)
  VALUES (
    '00000000-0000-0000-0000-000000000000', -- placeholder admin ID
    'new_user',
    'New User Registration',
    'New user ' || NEW.name || ' has registered on ' || NEW.created_at::date,
    jsonb_build_object(
      'user_id', NEW.id,
      'user_name', NEW.name,
      'phone', NEW.phone
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER notify_new_user_trigger
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_user();