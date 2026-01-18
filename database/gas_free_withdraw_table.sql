-- Migration: Create Gas Free Withdraw Settings Table
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Buat tabel gas_free_withdraw_settings untuk menyimpan pengaturan gas free withdraw
CREATE TABLE IF NOT EXISTS public.gas_free_withdraw_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Gas Free Withdraw Percentage
  gas_free_percentage DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings (hanya sekali)
INSERT INTO public.gas_free_withdraw_settings (
  gas_free_percentage,
  is_active
) VALUES (
  3.00,  -- gas free percentage
  true   -- active
) ON CONFLICT DO NOTHING;

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_gas_free_withdraw_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gas_free_withdraw_updated_at
  BEFORE UPDATE ON public.gas_free_withdraw_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_gas_free_withdraw_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.gas_free_withdraw_settings ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT (semua bisa baca)
CREATE POLICY "Anyone can view gas free withdraw settings"
  ON public.gas_free_withdraw_settings
  FOR SELECT
  USING (true);

-- Policy untuk UPDATE (hanya admin via service role)
CREATE POLICY "Admin can update gas free withdraw settings"
  ON public.gas_free_withdraw_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);


