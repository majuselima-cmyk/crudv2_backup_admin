-- Migration: Add Loyalty Percentage Level 3 to Bonus Settings
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Tambahkan field loyalty_percentage_level3 dengan default 0.5%
ALTER TABLE public.bonus_settings
  ADD COLUMN IF NOT EXISTS loyalty_percentage_level3 DECIMAL(5,2) NOT NULL DEFAULT 0.50;

-- Update existing records dengan default value jika NULL
UPDATE public.bonus_settings
SET loyalty_percentage_level3 = 0.50
WHERE loyalty_percentage_level3 IS NULL;

-- Update level 2 default ke 10% jika masih 0.5%
UPDATE public.bonus_settings
SET loyalty_percentage_level2 = 10.00
WHERE loyalty_percentage_level2 = 0.50;

-- Comment untuk dokumentasi
COMMENT ON COLUMN public.bonus_settings.loyalty_percentage IS 'Loyalty percentage level 1 (default 10%)';
COMMENT ON COLUMN public.bonus_settings.loyalty_percentage_level2 IS 'Loyalty percentage level 2 (default 0.5%)';
COMMENT ON COLUMN public.bonus_settings.loyalty_percentage_level3 IS 'Loyalty percentage level 3 (default 0.5%)';
