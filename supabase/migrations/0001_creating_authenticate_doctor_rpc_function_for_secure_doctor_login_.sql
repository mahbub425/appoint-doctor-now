CREATE OR REPLACE FUNCTION public.authenticate_doctor(
  doctor_username text,
  doctor_password text
)
RETURNS TABLE(
  id uuid,
  username text,
  name text,
  degree text,
  experience text,
  designation text,
  specialties text[],
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.username,
    d.name,
    d.degree,
    d.experience,
    d.designation,
    d.specialties,
    d.is_active,
    d.created_at,
    d.updated_at
  FROM
    public.doctors d
  WHERE
    d.username = doctor_username
    AND d.password_hash = doctor_password -- Direct comparison as per current app logic
    AND d.is_active = TRUE;
END;
$$;