-- Add function to automatically delete appointments older than 6 months
CREATE OR REPLACE FUNCTION public.cleanup_old_appointments()
RETURNS void AS $$
BEGIN
  DELETE FROM public.appointments 
  WHERE appointment_date < (CURRENT_DATE - INTERVAL '6 months');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to reschedule appointments when doctor schedule is updated
CREATE OR REPLACE FUNCTION public.reschedule_appointments_for_doctor(
  p_doctor_id UUID,
  p_availability_date DATE,
  p_start_time TIME,
  p_break_start TIME,
  p_break_end TIME
)
RETURNS void AS $$
DECLARE
  appointment_record RECORD;
  current_time TIME;
  appointment_duration INTEGER;
  durations JSONB := '{"New Patient": 10, "Follow Up": 7, "Report Show": 12}'::jsonb;
BEGIN
  current_time := p_start_time;
  
  -- Loop through appointments for this doctor and date, ordered by serial number
  FOR appointment_record IN 
    SELECT * FROM appointments 
    WHERE doctor_id = p_doctor_id 
    AND appointment_date = p_availability_date 
    ORDER BY serial_number
  LOOP
    -- Get duration for this appointment type
    appointment_duration := COALESCE((durations ->> appointment_record.reason)::integer, 10);
    
    -- Check if we need to skip break time
    IF current_time >= p_break_start AND current_time < p_break_end THEN
      current_time := p_break_end;
    END IF;
    
    -- Update appointment time
    UPDATE appointments 
    SET appointment_time = current_time
    WHERE id = appointment_record.id;
    
    -- Move to next appointment time
    current_time := current_time + (appointment_duration || ' minutes')::interval;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;