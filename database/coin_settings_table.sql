-- Migration: Create Coin Settings Table
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Buat tabel coin_settings untuk menyimpan pengaturan coin
CREATE TABLE IF NOT EXISTS public.coin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Coin Information
  coin_name TEXT NOT NULL DEFAULT 'MyCoin',
  total_supply DECIMAL(20,2) NOT NULL DEFAULT 999999999.00,
  
  -- Pricing berdasarkan jenis member
  price_per_coin_usdt DECIMAL(10,4) NOT NULL DEFAULT 0.5000, -- Normal member price
  leader_price_usdt DECIMAL(10,4) NOT NULL DEFAULT 0.5000, -- Leader member price
  presale_price_usdt DECIMAL(10,4) NOT NULL DEFAULT 0.4000, -- VIP member price
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings (hanya sekali)
INSERT INTO public.coin_settings (
  coin_name,
  total_supply,
  price_per_coin_usdt,
  leader_price_usdt,
  presale_price_usdt,
  is_active
) VALUES (
  'MyCoin',           -- coin name
  999999999.00,       -- total supply
  0.5000,            -- price per coin untuk normal member (USDT)
  0.5000,            -- price per coin untuk leader member (USDT)
  0.4000,            -- price per coin untuk VIP member (USDT)
  true                -- active
) ON CONFLICT DO NOTHING;

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_coin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coin_settings_updated_at
  BEFORE UPDATE ON public.coin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_coin_settings_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.coin_settings ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT (semua bisa baca)
CREATE POLICY "Anyone can view coin settings"
  ON public.coin_settings
  FOR SELECT
  USING (true);

-- Policy untuk UPDATE (hanya admin via service role)
CREATE POLICY "Admin can update coin settings"
  ON public.coin_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

