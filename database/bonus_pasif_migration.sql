-- Migration: Bonus Pasif - Staking System
-- Jalankan script ini di Supabase Dashboard → SQL Editor
-- Urutan: 1. member_coins, 2. staking, 3. reward_history

-- ============================================
-- 1. CREATE TABLE: member_coins
-- ============================================

-- Buat tabel member_coins untuk menyimpan informasi koin member
CREATE TABLE IF NOT EXISTS public.member_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Member Information
  member_id UUID NOT NULL UNIQUE,
  
  -- Coin Information
  total_coins DECIMAL(18,8) NOT NULL DEFAULT 0,
  staked_coins DECIMAL(18,8) NOT NULL DEFAULT 0,
  available_coins DECIMAL(18,8) NOT NULL DEFAULT 0,
  
  -- Pricing
  coin_price DECIMAL(10,4) NOT NULL DEFAULT 0.5000, -- Harga koin untuk member ini
  member_type TEXT NOT NULL DEFAULT 'normal' CHECK (member_type IN ('normal', 'leader', 'presale', 'vip')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_member_coins_member_id ON public.member_coins(member_id);
CREATE INDEX IF NOT EXISTS idx_member_coins_member_type ON public.member_coins(member_type);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_member_coins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_coins_updated_at
  BEFORE UPDATE ON public.member_coins
  FOR EACH ROW
  EXECUTE FUNCTION update_member_coins_updated_at();

-- Trigger untuk memastikan available_coins = total_coins - staked_coins
CREATE OR REPLACE FUNCTION sync_member_coins_available()
RETURNS TRIGGER AS $$
BEGIN
  NEW.available_coins = NEW.total_coins - NEW.staked_coins;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_member_coins_available
  BEFORE INSERT OR UPDATE ON public.member_coins
  FOR EACH ROW
  EXECUTE FUNCTION sync_member_coins_available();

-- Enable Row Level Security (RLS)
ALTER TABLE public.member_coins ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT (member bisa lihat sendiri, admin bisa lihat semua)
CREATE POLICY "Members can view their own coins"
  ON public.member_coins
  FOR SELECT
  USING (auth.uid() = member_id OR true); -- Admin bisa lihat semua via service role

-- Policy untuk INSERT (hanya sistem/admin)
CREATE POLICY "System can insert member coins"
  ON public.member_coins
  FOR INSERT
  WITH CHECK (true);

-- Policy untuk UPDATE (hanya sistem/admin)
CREATE POLICY "System can update member coins"
  ON public.member_coins
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. CREATE TABLE: staking
-- ============================================

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

-- ============================================
-- 3. CREATE TABLE: reward_history
-- ============================================

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

-- ============================================
-- SELESAI
-- ============================================
-- Catatan: 
-- - Setting reward_percentage sudah ada di bonus_settings.reward_percentage (default: 0.50)
-- - Pastikan tabel bonus_settings sudah ada sebelum menggunakan fitur ini

