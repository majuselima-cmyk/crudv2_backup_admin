-- Migration: Add coin_code column to coin_settings table
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Tambahkan kolom coin_code ke tabel coin_settings
DO $$
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coin_settings' 
    AND column_name = 'coin_code'
  ) THEN
    -- Add coin_code column
    ALTER TABLE public.coin_settings 
    ADD COLUMN coin_code VARCHAR(10) NOT NULL DEFAULT 'COIN';
    
    -- Add comment
    COMMENT ON COLUMN public.coin_settings.coin_code IS 'Kode singkat untuk coin (contoh: BTC, ETH, MYC)';
    
    -- Update existing records with default value if needed
    UPDATE public.coin_settings 
    SET coin_code = 'COIN' 
    WHERE coin_code IS NULL OR coin_code = '';
  END IF;
END $$;

