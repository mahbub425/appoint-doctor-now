-- Create function to authenticate admin users
CREATE OR REPLACE FUNCTION public.authenticate_admin(user_pin text, user_password text)
RETURNS TABLE(user_id uuid, user_name text, is_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Authenticate user by PIN and password, only return if user is admin
  RETURN QUERY
  SELECT id, name, users.is_admin
  FROM public.users 
  WHERE pin = user_pin 
    AND password = user_password 
    AND (is_blocked IS FALSE OR is_blocked IS NULL)
    AND is_admin = TRUE;
END;
$function$;