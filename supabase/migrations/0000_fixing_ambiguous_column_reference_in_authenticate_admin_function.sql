CREATE OR REPLACE FUNCTION public.authenticate_admin(admin_username text, admin_password text)
 RETURNS TABLE(user_id uuid, user_name text, user_role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Authenticate user by username and password, only return if user is admin
  RETURN QUERY
  SELECT id, name, users.user_role
  FROM public.users
  WHERE username = admin_username
    AND password = admin_password
    AND (is_blocked IS FALSE OR is_blocked IS NULL)
    AND users.user_role = 'admin'; -- Qualified user_role here
END;
$function$;