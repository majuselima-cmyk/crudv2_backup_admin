-- Add member_id column to contact_us table
ALTER TABLE public.contact_us 
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.members(id) ON DELETE SET NULL;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_contact_us_member_id ON public.contact_us(member_id);
