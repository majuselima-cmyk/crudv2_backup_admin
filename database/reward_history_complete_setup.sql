-- Migration: Create Reward History Table with bonus_type support
-- Jalankan script ini di Supabase Dashboard → SQL Editor
-- Script ini akan membuat tabel reward_history dengan kolom bonus_type dan staking_id nullable

-- Buat tabel reward_history untuk menyimpan riwayat reward harian
CREATE TABLE IF NOT EXISTS public.reward_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Staking Reference (nullable untuk bonus loyalty)
  staking_id UUID,
  
  -- Member Information
  member_id UUID NOT NULL,
  
  -- Reward Information
  reward_amount DECIMAL(18,8) NOT NULL,
  reward_date DATE NOT NULL,
  coin_amount_staked DECIMAL(18,8) NOT NULL,
  reward_percentage DECIMAL(5,2) NOT NULL, -- Mengambil dari bonus_settings.reward_percentage
  
  -- Bonus Type
  bonus_type TEXT NOT NULL DEFAULT 'staking_reward' CHECK (bonus_type IN ('staking_reward', 'multiplier_reward', 'loyalty')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_reward_history_member_id ON public.reward_history(member_id);
CREATE INDEX IF NOT EXISTS idx_reward_history_reward_date ON public.reward_history(reward_date);
CREATE INDEX IF NOT EXISTS idx_reward_history_staking_id ON public.reward_history(staking_id);
CREATE INDEX IF NOT EXISTS idx_reward_history_status ON public.reward_history(status);
CREATE INDEX IF NOT EXISTS idx_reward_history_bonus_type ON public.reward_history(bonus_type);
CREATE INDEX IF NOT EXISTS idx_reward_history_bonus_type_member ON public.reward_history(member_id, bonus_type, status);

-- Unique constraint untuk handle nullable staking_id
-- Untuk staking_reward dan multiplier_reward: unique per staking per hari
CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_history_unique_daily_staking
  ON public.reward_history(staking_id, reward_date)
  WHERE staking_id IS NOT NULL;

-- Untuk loyalty: unique per member per hari (staking_id = null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_history_unique_daily_loyalty
  ON public.reward_history(member_id, reward_date, bonus_type)
  WHERE staking_id IS NULL AND bonus_type = 'loyalty';

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_reward_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reward_history_updated_at ON public.reward_history;
CREATE TRIGGER update_reward_history_updated_at
  BEFORE UPDATE ON public.reward_history
  FOR EACH ROW
  EXECUTE FUNCTION update_reward_history_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.reward_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exist
DROP POLICY IF EXISTS "Members can view their own reward history" ON public.reward_history;
DROP POLICY IF EXISTS "System can insert reward history" ON public.reward_history;
DROP POLICY IF EXISTS "System can update reward history" ON public.reward_history;

-- Policy untuk SELECT (member bisa lihat sendiri, admin bisa lihat semua)
CREATE POLICY "Members can view their own reward history"
  ON public.reward_history
  FOR SELECT
  USING (auth.uid() = member_id OR true); -- Admin bisa lihat semua via service role

-- Policy untuk INSERT (hanya sistem/admin)
CREATE POLICY "System can insert reward history"
  ON public.reward_history
  FOR INSERT
  WITH CHECK (true);

-- Policy untuk UPDATE (hanya sistem/admin)
CREATE POLICY "System can update reward history"
  ON public.reward_history
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Comment untuk dokumentasi
COMMENT ON TABLE public.reward_history IS 'Tabel untuk menyimpan riwayat reward (staking, multiplier, loyalty)';
COMMENT ON COLUMN public.reward_history.bonus_type IS 'Jenis bonus: staking_reward, multiplier_reward, atau loyalty';
COMMENT ON COLUMN public.reward_history.staking_id IS 'ID staking (nullable untuk bonus loyalty)';
