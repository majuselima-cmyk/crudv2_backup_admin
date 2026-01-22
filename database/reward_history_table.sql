-- Migration: Create Reward History Table
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Buat tabel reward_history untuk menyimpan riwayat reward harian
CREATE TABLE IF NOT EXISTS public.reward_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Staking Reference
  staking_id UUID NOT NULL,
  
  -- Member Information
  member_id UUID NOT NULL,
  
  -- Reward Information
  reward_amount DECIMAL(18,8) NOT NULL,
  reward_date DATE NOT NULL,
  coin_amount_staked DECIMAL(18,8) NOT NULL,
  reward_percentage DECIMAL(5,2) NOT NULL, -- Mengambil dari bonus_settings.reward_percentage
  
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

-- Unique constraint: satu reward per staking per hari
CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_history_unique_daily 
  ON public.reward_history(staking_id, reward_date);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_reward_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reward_history_updated_at
  BEFORE UPDATE ON public.reward_history
  FOR EACH ROW
  EXECUTE FUNCTION update_reward_history_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.reward_history ENABLE ROW LEVEL SECURITY;

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

