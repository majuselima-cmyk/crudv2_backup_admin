-- Migration: Add withdraw_category column to withdraws table
-- File: admin-package/database/withdraws_add_withdraw_category.sql
-- Description: Tambahkan kolom withdraw_category untuk membedakan jenis withdraw lebih spesifik

-- Add withdraw_category column to withdraws table
ALTER TABLE public.withdraws 
ADD COLUMN IF NOT EXISTS withdraw_category VARCHAR(50) NULL;

-- Add comment for the new column
COMMENT ON COLUMN public.withdraws.withdraw_category IS 'Kategori withdraw: bonus_referral (untuk balance USDT dari bonus pasif referral 80%), coin (untuk withdraw coin)';

-- Update existing records based on withdraw_type
-- Jika withdraw_type = 'balance', set withdraw_category = 'bonus_referral'
UPDATE public.withdraws 
SET withdraw_category = 'bonus_referral'
WHERE withdraw_type IN ('balance', 'balance_deposit', 'balance_bonus', 'coin') 
  AND withdraw_category IS NULL;

-- Jika withdraw_type = 'bonus_aktif' atau 'bonus_pasif', biarkan NULL atau set sesuai kebutuhan
-- (bisa di-update manual jika diperlukan)

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_withdraws_withdraw_category ON public.withdraws(withdraw_category) WHERE withdraw_category IS NOT NULL;
