-- Migration: Add Loyalty Percentage Level 2 to Bonus Settings
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Tambahkan field loyalty_percentage_level2 dengan default 0.5%
ALTER TABLE public.bonus_settings
  ADD COLUMN IF NOT EXISTS loyalty_percentage_level2 DECIMAL(5,2) NOT NULL DEFAULT 0.50;

-- Update existing records dengan default value jika NULL
UPDATE public.bonus_settings
SET loyalty_percentage_level2 = 0.50
WHERE loyalty_percentage_level2 IS NULL;

-- Comment untuk dokumentasi
COMMENT ON COLUMN public.bonus_settings.loyalty_percentage IS 'Loyalty percentage level 1 (default 10%)';
COMMENT ON COLUMN public.bonus_settings.loyalty_percentage_level2 IS 'Loyalty percentage level 2 (default 0.5%)';
