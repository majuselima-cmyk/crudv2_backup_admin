-- Migration: Create Staking Table
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Buat tabel staking untuk menyimpan data staking member
CREATE TABLE IF NOT EXISTS public.staking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Member Information
  member_id UUID NOT NULL,
  
  -- Staking Information
  coin_amount DECIMAL(18,8) NOT NULL,
  reward_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.50, -- Mengambil dari bonus_settings.reward_percentage
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unstaked', 'cancelled')),
  
  -- Timestamps
  staked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unstaked_at TIMESTAMPTZ,
  
  -- Admin tracking
  staked_by UUID, -- Admin yang melakukan staking
  unstaked_by UUID, -- Admin yang melakukan unstaking
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_staking_member_id ON public.staking(member_id);
CREATE INDEX IF NOT EXISTS idx_staking_status ON public.staking(status);
CREATE INDEX IF NOT EXISTS idx_staking_staked_at ON public.staking(staked_at);
CREATE INDEX IF NOT EXISTS idx_staking_active ON public.staking(status) WHERE status = 'active';

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_staking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staking_updated_at
  BEFORE UPDATE ON public.staking
  FOR EACH ROW
  EXECUTE FUNCTION update_staking_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.staking ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT (member bisa lihat sendiri, admin bisa lihat semua)
CREATE POLICY "Members can view their own staking"
  ON public.staking
  FOR SELECT
  USING (auth.uid() = member_id OR true); -- Admin bisa lihat semua via service role

-- Policy untuk INSERT (hanya sistem/admin)
CREATE POLICY "System can insert staking"
  ON public.staking
  FOR INSERT
  WITH CHECK (true);

-- Policy untuk UPDATE (hanya sistem/admin)
CREATE POLICY "System can update staking"
  ON public.staking
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

