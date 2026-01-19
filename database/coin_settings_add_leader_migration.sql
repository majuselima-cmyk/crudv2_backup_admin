-- Migration: Add Leader Price to Coin Settings
-- Jalankan script ini di Supabase Dashboard → SQL Editor
-- File: database/coin_settings_add_leader_migration.sql

-- Tambahkan kolom leader_price_usdt ke tabel coin_settings
-- IF NOT EXISTS akan mencegah error jika kolom sudah ada
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
        
        RAISE NOTICE 'Kolom leader_price_usdt berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom leader_price_usdt sudah ada, melewati...';
    END IF;
END $$;

-- Update existing records dengan default value jika belum ada
UPDATE public.coin_settings 
SET leader_price_usdt = 0.5000 
WHERE leader_price_usdt IS NULL;

