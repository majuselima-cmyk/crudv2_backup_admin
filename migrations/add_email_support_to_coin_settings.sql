ALTER TABLE public.coin_settings
ADD COLUMN IF NOT EXISTS email_support TEXT DEFAULT NULL;
