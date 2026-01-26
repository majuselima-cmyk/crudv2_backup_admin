-- Migration: Rename Loyalty Percentage Columns to Level 0, 1, 2
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Rename kolom untuk konsistensi naming
-- loyalty_percentage → loyalty_percentage_level0
-- loyalty_percentage_level2 → loyalty_percentage_level1
-- loyalty_percentage_level3 → loyalty_percentage_level2

-- Step 1: Tambahkan kolom baru jika belum ada
ALTER TABLE public.bonus_settings
  ADD COLUMN IF NOT EXISTS loyalty_percentage_level0 DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS loyalty_percentage_level1 DECIMAL(5,2);

-- Step 2: Copy data dari kolom lama ke kolom baru
UPDATE public.bonus_settings
SET 
  loyalty_percentage_level0 = loyalty_percentage,
  loyalty_percentage_level1 = loyalty_percentage_level2
WHERE loyalty_percentage_level0 IS NULL OR loyalty_percentage_level1 IS NULL;

-- Step 3: Set default values jika masih NULL
UPDATE public.bonus_settings
SET 
  loyalty_percentage_level0 = COALESCE(loyalty_percentage_level0, 10.00),
  loyalty_percentage_level1 = COALESCE(loyalty_percentage_level1, 10.00),
  loyalty_percentage_level2 = COALESCE(loyalty_percentage_level2, 0.50)
WHERE loyalty_percentage_level0 IS NULL OR loyalty_percentage_level1 IS NULL OR loyalty_percentage_level2 IS NULL;

-- Step 4: Set NOT NULL constraint
ALTER TABLE public.bonus_settings
  ALTER COLUMN loyalty_percentage_level0 SET NOT NULL,
  ALTER COLUMN loyalty_percentage_level1 SET NOT NULL,
  ALTER COLUMN loyalty_percentage_level2 SET NOT NULL;

-- Step 5: Set default values untuk kolom baru
ALTER TABLE public.bonus_settings
  ALTER COLUMN loyalty_percentage_level0 SET DEFAULT 10.00,
  ALTER COLUMN loyalty_percentage_level1 SET DEFAULT 10.00,
  ALTER COLUMN loyalty_percentage_level2 SET DEFAULT 0.50;

-- Step 6: Hapus kolom lama (optional, bisa di-comment jika ingin keep backup)
-- ALTER TABLE public.bonus_settings
--   DROP COLUMN IF EXISTS loyalty_percentage,
--   DROP COLUMN IF EXISTS loyalty_percentage_level2;

-- Step 7: Update comments
COMMENT ON COLUMN public.bonus_settings.loyalty_percentage_level0 IS 'Loyalty percentage level 0 (default 10%)';
COMMENT ON COLUMN public.bonus_settings.loyalty_percentage_level1 IS 'Loyalty percentage level 1 (default 10%)';
COMMENT ON COLUMN public.bonus_settings.loyalty_percentage_level2 IS 'Loyalty percentage level 2 (default 0.5%)';
