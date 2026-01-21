-- Migration: Add Split Ratio for Bonus Aktif
-- Revisi: Bonus Aktif referral 15% di split menjadi:
-- 80% masuk ke balance USDT
-- 20% masuk ke coin

-- Tambahkan kolom untuk split ratio bonus aktif
ALTER TABLE public.bonus_settings
ADD COLUMN IF NOT EXISTS referral_balance_percentage DECIMAL(5,2) NOT NULL DEFAULT 80.00,
ADD COLUMN IF NOT EXISTS referral_coin_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00;

-- Update existing records dengan default split ratio
UPDATE public.bonus_settings
SET 
  referral_balance_percentage = 80.00,
  referral_coin_percentage = 20.00
WHERE referral_balance_percentage IS NULL OR referral_coin_percentage IS NULL;

-- Add comments
COMMENT ON COLUMN public.bonus_settings.referral_balance_percentage IS 'Persentase dari referral bonus yang masuk ke balance USDT (default: 80%)';
COMMENT ON COLUMN public.bonus_settings.referral_coin_percentage IS 'Persentase dari referral bonus yang masuk ke coin (default: 20%)';

