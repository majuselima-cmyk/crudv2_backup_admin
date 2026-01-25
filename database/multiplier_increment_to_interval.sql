-- Migration: Convert multiplier_increment_percentage to Interval (Minutes)
-- Jalankan script ini di Supabase Dashboard → SQL Editor
-- 
-- DESKRIPSI:
-- Mengubah kolom multiplier_increment_percentage dari DECIMAL (persen) 
-- menjadi INTEGER (menit) untuk interval staking multiplier.
-- Bukan pakai reward_interval_minutes (itu untuk staking biasa).
-- multiplier_increment_percentage sekarang menyimpan interval (menit) untuk staking multiplier.

-- ============================================
-- STEP 1: Backup data existing (optional)
-- ============================================
-- Jika perlu backup, bisa create table backup dulu:
-- CREATE TABLE bonus_settings_backup AS SELECT * FROM bonus_settings;

-- ============================================
-- STEP 2: Add temporary column untuk migration
-- ============================================
ALTER TABLE public.bonus_settings
ADD COLUMN IF NOT EXISTS multiplier_increment_interval_minutes INTEGER;

-- ============================================
-- STEP 3: Convert data existing
-- ============================================
-- Convert nilai existing dari persen ke menit
-- Default: jika nilai persen = 10.00, convert ke 10080 menit (7 hari)
-- Atau bisa set default sesuai kebutuhan
UPDATE public.bonus_settings
SET multiplier_increment_interval_minutes = 
  CASE 
    -- Jika nilai persen ada, convert ke menit (contoh: 10% = 10080 menit = 7 hari)
    -- Atau bisa set default 10080 (7 hari) untuk semua
    WHEN multiplier_increment_percentage IS NOT NULL THEN 10080 -- Default 7 hari
    ELSE 10080 -- Default jika NULL
  END;

-- ============================================
-- STEP 4: Drop kolom lama (multiplier_increment_percentage)
-- ============================================
ALTER TABLE public.bonus_settings
DROP COLUMN IF EXISTS multiplier_increment_percentage;

-- ============================================
-- STEP 5: Rename kolom baru menjadi multiplier_increment_percentage
-- ============================================
-- Catatan: Nama kolom tetap multiplier_increment_percentage untuk backward compatibility
-- tapi tipe datanya INTEGER (menit), bukan DECIMAL (persen)
ALTER TABLE public.bonus_settings
RENAME COLUMN multiplier_increment_interval_minutes TO multiplier_increment_percentage;

-- ============================================
-- STEP 6: Set NOT NULL dan default
-- ============================================
ALTER TABLE public.bonus_settings
ALTER COLUMN multiplier_increment_percentage SET NOT NULL,
ALTER COLUMN multiplier_increment_percentage SET DEFAULT 10080; -- Default 7 hari (10080 menit)

-- ============================================
-- STEP 7: Add comment untuk dokumentasi
-- ============================================
COMMENT ON COLUMN public.bonus_settings.multiplier_increment_percentage IS 
  'Interval (menit) untuk staking multiplier. Bukan persen - nilai dalam menit. Default: 10080 menit (7 hari).';

-- ============================================
-- VERIFIKASI
-- ============================================
-- Jalankan query ini untuk memastikan migration berhasil:

-- Check tipe data kolom
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bonus_settings'
  AND column_name = 'multiplier_increment_percentage';

-- Check data existing
SELECT 
  id,
  multiplier_percentage,
  multiplier_increment_percentage,
  multiplier_increment_minutes,
  reward_interval_minutes
FROM public.bonus_settings
LIMIT 5;

-- ============================================
-- CATATAN PENTING:
-- ============================================
-- 1. Kolom multiplier_increment_percentage sekarang INTEGER (menit), bukan DECIMAL (persen)
-- 2. Nilai default: 10080 menit = 7 hari
-- 3. Bukan pakai reward_interval_minutes (itu untuk staking biasa)
-- 4. multiplier_increment_percentage = interval (menit) untuk staking multiplier
-- 5. Update API/backend untuk handle INTEGER bukan DECIMAL
-- 6. Update frontend untuk display sebagai menit, bukan persen
-- ============================================
