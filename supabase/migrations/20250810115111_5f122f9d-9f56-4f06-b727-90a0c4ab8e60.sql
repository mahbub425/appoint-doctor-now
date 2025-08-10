-- Remove old concern check constraint and add new one with updated values
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_concern_check;

-- Add new constraint with updated concern values
ALTER TABLE public.appointments ADD CONSTRAINT appointments_concern_check 
CHECK (concern IN (
  'OnnoRokom Group',
  'OnnoRokom Projukti Limited', 
  'Udvash-Unmesh-Uttoron',
  'OnnoRorkom Electronics Co. Ltd.',
  'OnnoRokom Solutions Ltd.',
  'Pi Labs Bangladesh Ltd.',
  'OnnoRokom EdTech Ltd.',
  'Techshop Bangladesh'
));