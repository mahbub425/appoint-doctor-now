-- Check what status values are currently allowed and add 'accepted', 'rejected', 'completed' if needed
-- First, let's see what constraint exists
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%status%' AND constraint_schema = 'public';

-- Add the missing status values to the appointments table
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('upcoming', 'accepted', 'rejected', 'completed', 'absent', 'pending'));