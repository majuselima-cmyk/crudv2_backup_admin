-- Migration: Add reward interval settings and multiplier increment in minutes
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Add columns ke bonus_settings table
ALTER TABLE public.bonus_settings
ADD COLUMN IF NOT EXISTS reward_interval_minutes INTEGER NOT NULL DEFAULT 240, -- 240 menit = 1 hari
ADD COLUMN IF NOT EXISTS last_reward_calculated TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS multiplier_increment_minutes INTEGER NOT NULL DEFAULT 10080; -- 10080 menit = 7 hari

-- Create index untuk performa
CREATE INDEX IF NOT EXISTS idx_bonus_settings_reward_interval ON public.bonus_settings(reward_interval_minutes);
