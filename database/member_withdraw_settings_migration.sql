-- Migration: Add Withdraw Settings to Members Table
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Tambahkan kolom untuk withdraw settings
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS bonus_aktif_withdraw_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS bonus_pasif_withdraw_enabled BOOLEAN NOT NULL DEFAULT true;

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_members_bonus_aktif_withdraw ON public.members(bonus_aktif_withdraw_enabled);
CREATE INDEX IF NOT EXISTS idx_members_bonus_pasif_withdraw ON public.members(bonus_pasif_withdraw_enabled);

-- Update existing members dengan default values
UPDATE public.members
SET bonus_aktif_withdraw_enabled = true,
    bonus_pasif_withdraw_enabled = true
WHERE bonus_aktif_withdraw_enabled IS NULL 
   OR bonus_pasif_withdraw_enabled IS NULL;





