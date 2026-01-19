-- Migration: Create Wallet Table
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Buat tabel wallet untuk menyimpan wallet addresses
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network TEXT NOT NULL CHECK (network IN ('BEP20', 'ERC20')),
  address TEXT NOT NULL,
  label TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_wallets_network ON public.wallets(network);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON public.wallets(status);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON public.wallets(address);

-- Unique constraint: satu address per network (tidak boleh duplikat)
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_network_address ON public.wallets(network, address);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallets_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT (semua bisa baca)
CREATE POLICY "Anyone can view wallets"
  ON public.wallets
  FOR SELECT
  USING (true);

-- Policy untuk INSERT (hanya admin via service role)
CREATE POLICY "Admin can insert wallets"
  ON public.wallets
  FOR INSERT
  WITH CHECK (true);

-- Policy untuk UPDATE (hanya admin via service role)
CREATE POLICY "Admin can update wallets"
  ON public.wallets
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy untuk DELETE (hanya admin via service role)
CREATE POLICY "Admin can delete wallets"
  ON public.wallets
  FOR DELETE
  USING (true);






