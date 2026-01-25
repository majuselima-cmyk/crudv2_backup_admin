-- Migration: Add unstaked_at column to bonus_multiplier_staking table
-- Jalankan script ini di Supabase Dashboard → SQL Editor

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bonus_multiplier_staking'
        AND column_name = 'unstaked_at'
    ) THEN
        ALTER TABLE public.bonus_multiplier_staking
        ADD COLUMN unstaked_at TIMESTAMPTZ;
        RAISE NOTICE 'Column unstaked_at added to bonus_multiplier_staking table';
    ELSE
        RAISE NOTICE 'Column unstaked_at already exists in bonus_multiplier_staking table';
    END IF;
END $$;
