-- Add truthful provider/channel metadata to the existing internal notification projection.
ALTER TABLE public.command_centre_notifications
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS provider_state TEXT,
  ADD COLUMN IF NOT EXISTS detail TEXT;
