-- Remove automatic data cleanup function to keep all data permanently
DROP FUNCTION IF EXISTS public.cleanup_old_appointments();