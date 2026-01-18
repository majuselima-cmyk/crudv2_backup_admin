-- Migration: Create Bonus Settings Table
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Buat tabel bonus_settings untuk menyimpan pengaturan bonus
CREATE TABLE IF NOT EXISTS public.bonus_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Bonus Aktif
  referral_percentage DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  matching_level1_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  matching_level2_percentage DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  matching_level3_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.00,
  loyalty_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  
  -- Bonus Pasif
  reward_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.50,
  multiplier_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  multiplier_increment_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  multiplier_increment_days INTEGER NOT NULL DEFAULT 7,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings (hanya sekali)
INSERT INTO public.bonus_settings (
  referral_percentage,
  matching_level1_percentage,
  matching_level2_percentage,
  matching_level3_percentage,
  loyalty_percentage,
  reward_percentage,
  multiplier_percentage,
  multiplier_increment_percentage,
  multiplier_increment_days,
  is_active
) VALUES (
  15.00,  -- referral
  10.00,  -- matching level 1
  5.00,   -- matching level 2
  2.00,   -- matching level 3
  10.00,  -- loyalty
  0.50,   -- reward
  10.00,  -- multiplier base
  10.00,  -- multiplier increment percentage
  7,      -- multiplier increment days
  true
) ON CONFLICT DO NOTHING;

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_bonus_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bonus_settings_updated_at
  BEFORE UPDATE ON public.bonus_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_bonus_settings_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.bonus_settings ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT (semua bisa baca)
CREATE POLICY "Anyone can view bonus settings"
  ON public.bonus_settings
  FOR SELECT
  USING (true);

-- Policy untuk UPDATE (hanya admin via service role)
CREATE POLICY "Admin can update bonus settings"
  ON public.bonus_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

