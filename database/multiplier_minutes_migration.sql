-- Migration: Switch Multiplier Increment to Minutes
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Hapus kolom days lama
ALTER TABLE public.bonus_settings
DROP COLUMN IF EXISTS multiplier_increment_days;

-- Tambahkan kolom minutes baru
ALTER TABLE public.bonus_settings
ADD COLUMN IF NOT EXISTS multiplier_increment_minutes INTEGER DEFAULT 10;

-- Update default value
UPDATE public.bonus_settings
SET multiplier_increment_minutes = 10
WHERE multiplier_increment_minutes IS NULL;

-- Set NOT NULL
ALTER TABLE public.bonus_settings
ALTER COLUMN multiplier_increment_minutes SET NOT NULL;

