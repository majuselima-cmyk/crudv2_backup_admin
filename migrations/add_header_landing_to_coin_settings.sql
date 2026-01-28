ALTER TABLE public.coin_settings
ADD COLUMN IF NOT EXISTS header_landing TEXT DEFAULT NULL;
