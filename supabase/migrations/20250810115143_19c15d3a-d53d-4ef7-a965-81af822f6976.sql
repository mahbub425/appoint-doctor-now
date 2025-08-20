-- Remove the check constraint first
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_concern_check;

-- Update existing appointment data to match new concern names
UPDATE public.appointments 
SET concern = CASE 
  WHEN concern = 'OPL' THEN 'OnnoRokom Projukti Limited'
  WHEN concern = 'OG' THEN 'OnnoRokom Group'
  WHEN concern = 'Udvash' THEN 'Udvash-Unmesh-Uttoron'
  WHEN concern = 'Rokomari' THEN 'OnnoRokom Group'
  WHEN concern = 'Unmesh' THEN 'Udvash-Unmesh-Uttoron'
  WHEN concern = 'Uttoron' THEN 'Udvash-Unmesh-Uttoron'
  ELSE concern
END;

-- Now add the new constraint with updated values
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