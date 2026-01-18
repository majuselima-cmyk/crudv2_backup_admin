-- Migration: Add Multiplier Increment Columns (Dynamic)
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Tambahkan kolom multiplier_increment_percentage jika belum ada
ALTER TABLE public.bonus_settings
ADD COLUMN IF NOT EXISTS multiplier_increment_percentage DECIMAL(5,2);

-- Tambahkan kolom multiplier_increment_days jika belum ada
ALTER TABLE public.bonus_settings
ADD COLUMN IF NOT EXISTS multiplier_increment_days INTEGER;

-- Update existing records dengan default values jika NULL
UPDATE public.bonus_settings
SET multiplier_increment_percentage = 10.00
WHERE multiplier_increment_percentage IS NULL;

UPDATE public.bonus_settings
SET multiplier_increment_days = 7
WHERE multiplier_increment_days IS NULL;

-- Set NOT NULL dan default setelah update data existing
ALTER TABLE public.bonus_settings
ALTER COLUMN multiplier_increment_percentage SET NOT NULL,
ALTER COLUMN multiplier_increment_percentage SET DEFAULT 10.00,
ALTER COLUMN multiplier_increment_days SET NOT NULL,
ALTER COLUMN multiplier_increment_days SET DEFAULT 7;

-- Drop kolom lama jika ada (untuk migration dari versi sebelumnya)
ALTER TABLE public.bonus_settings
DROP COLUMN IF EXISTS multiplier_increment_per_7days;

