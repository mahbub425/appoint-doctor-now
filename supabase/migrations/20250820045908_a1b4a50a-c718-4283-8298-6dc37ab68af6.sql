-- Create function to grant admin access to a user
CREATE OR REPLACE FUNCTION public.grant_admin_access(user_pin text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.users 
  SET is_admin = TRUE, updated_at = now()
  WHERE pin = user_pin 
    AND (is_blocked IS FALSE OR is_blocked IS NULL);
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$function$;

-- Create function to revoke admin access from a user
CREATE OR REPLACE FUNCTION public.revoke_admin_access(user_pin text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.users 
  SET is_admin = FALSE, updated_at = now()
  WHERE pin = user_pin;
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$function$;