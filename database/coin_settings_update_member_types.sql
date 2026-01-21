-- Migration: Update Coin Settings untuk Member Types
-- Jalankan script ini di Supabase Dashboard → SQL Editor
-- Script ini akan:
-- 1. Menambahkan kolom leader_price_usdt jika belum ada
-- 2. Update default values: normal=0.5, leader=0.5, vip=0.4

-- Step 1: Tambahkan kolom leader_price_usdt jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coin_settings' 
    AND column_name = 'leader_price_usdt'
  ) THEN
    ALTER TABLE public.coin_settings 
    ADD COLUMN leader_price_usdt DECIMAL(10,4) NOT NULL DEFAULT 0.5000;
    
    COMMENT ON COLUMN public.coin_settings.leader_price_usdt IS 'Harga coin untuk member Leader (USDT)';
  END IF;
END $$;

-- Step 2: Update default values untuk existing records
-- Normal = 0.5, Leader = 0.5, VIP = 0.4
UPDATE public.coin_settings
SET 
  price_per_coin_usdt = COALESCE(price_per_coin_usdt, 0.5000), -- Normal member
  leader_price_usdt = COALESCE(leader_price_usdt, 0.5000), -- Leader member
  presale_price_usdt = COALESCE(presale_price_usdt, 0.4000) -- VIP member
WHERE 
  price_per_coin_usdt IS NULL 
  OR leader_price_usdt IS NULL 
  OR presale_price_usdt IS NULL;

-- Step 3: Set default values untuk insert baru (jika belum ada data)
-- Default values sudah di-set di CREATE TABLE, tapi pastikan juga di sini
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.coin_settings) THEN
    INSERT INTO public.coin_settings (
      coin_name,
      total_supply,
      price_per_coin_usdt,  -- Normal = 0.5
      leader_price_usdt,     -- Leader = 0.5
      presale_price_usdt,    -- VIP = 0.4
      is_active
    ) VALUES (
      'MyCoin',
      999999999.00,
      0.5000,  -- Normal member price
      0.5000,  -- Leader member price
      0.4000,  -- VIP member price
      true
    );
  END IF;
END $$;

-- Step 4: Update comments
COMMENT ON COLUMN public.coin_settings.price_per_coin_usdt IS 'Harga coin untuk member Normal (USDT) - Default: 0.5';
COMMENT ON COLUMN public.coin_settings.leader_price_usdt IS 'Harga coin untuk member Leader (USDT) - Default: 0.5';
COMMENT ON COLUMN public.coin_settings.presale_price_usdt IS 'Harga coin untuk member VIP (USDT) - Default: 0.4';

-- Catatan:
-- - Normal member: price_per_coin_usdt = 0.5 USDT
-- - Leader member: leader_price_usdt = 0.5 USDT
-- - VIP member: presale_price_usdt = 0.4 USDT
-- - Semua harga sudah di-set sesuai requirement

