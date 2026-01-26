-- Migration: Remove Loyalty Percentage Levels 3-5 from Bonus Settings
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Hapus kolom loyalty_percentage_level3, level4, level5 jika ada
ALTER TABLE public.bonus_settings
  DROP COLUMN IF EXISTS loyalty_percentage_level3,
  DROP COLUMN IF EXISTS loyalty_percentage_level4,
  DROP COLUMN IF EXISTS loyalty_percentage_level5;
