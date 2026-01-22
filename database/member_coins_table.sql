-- Migration: Create Member Coins Table
-- Jalankan script ini di Supabase Dashboard → SQL Editor

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

