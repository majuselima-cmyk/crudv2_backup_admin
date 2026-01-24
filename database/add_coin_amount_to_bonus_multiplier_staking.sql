-- Migration: Add coin_amount column to bonus_multiplier_staking table
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Add coin_amount column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bonus_multiplier_staking' 
        AND column_name = 'coin_amount'
    ) THEN
        ALTER TABLE public.bonus_multiplier_staking
        ADD COLUMN coin_amount DECIMAL(18,8) NOT NULL DEFAULT 0;
        
        -- Update existing records if any (set to 0 as default, adjust if needed)
        UPDATE public.bonus_multiplier_staking
        SET coin_amount = 0
        WHERE coin_amount IS NULL;
        
        RAISE NOTICE 'Column coin_amount added to bonus_multiplier_staking table';
    ELSE
        RAISE NOTICE 'Column coin_amount already exists in bonus_multiplier_staking table';
    END IF;
END $$;

