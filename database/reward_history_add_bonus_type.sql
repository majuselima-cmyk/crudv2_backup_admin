-- Migration: Add bonus_type column to reward_history
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Tambahkan kolom bonus_type untuk membedakan jenis bonus
ALTER TABLE public.reward_history
  ADD COLUMN IF NOT EXISTS bonus_type TEXT DEFAULT 'staking_reward' CHECK (bonus_type IN ('staking_reward', 'multiplier_reward', 'loyalty'));

-- Update existing records dengan default value
UPDATE public.reward_history
SET bonus_type = 'staking_reward'
WHERE bonus_type IS NULL;

-- Set NOT NULL setelah update
ALTER TABLE public.reward_history
  ALTER COLUMN bonus_type SET NOT NULL,
  ALTER COLUMN bonus_type SET DEFAULT 'staking_reward';

-- Tambahkan index untuk performa query
CREATE INDEX IF NOT EXISTS idx_reward_history_bonus_type ON public.reward_history(bonus_type);
CREATE INDEX IF NOT EXISTS idx_reward_history_bonus_type_member ON public.reward_history(member_id, bonus_type, status);

-- Make staking_id nullable untuk bonus loyalty (tidak perlu staking_id)
ALTER TABLE public.reward_history
  ALTER COLUMN staking_id DROP NOT NULL;

-- Update unique constraint untuk handle nullable staking_id
-- Drop existing unique constraint
DROP INDEX IF EXISTS idx_reward_history_unique_daily;

-- Create new unique constraint yang handle nullable staking_id
-- Untuk staking_reward dan multiplier_reward: unique per staking per hari
-- Untuk loyalty: unique per member per hari (staking_id = null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_history_unique_daily_staking
  ON public.reward_history(staking_id, reward_date)
  WHERE staking_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_history_unique_daily_loyalty
  ON public.reward_history(member_id, reward_date, bonus_type)
  WHERE staking_id IS NULL AND bonus_type = 'loyalty';

-- Comment untuk dokumentasi
COMMENT ON COLUMN public.reward_history.bonus_type IS 'Jenis bonus: staking_reward, multiplier_reward, atau loyalty';
COMMENT ON COLUMN public.reward_history.staking_id IS 'ID staking (nullable untuk bonus loyalty)';
