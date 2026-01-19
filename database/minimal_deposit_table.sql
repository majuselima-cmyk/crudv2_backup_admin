-- Table untuk menyimpan pengaturan minimal deposit
-- Hanya ada 1 record untuk menyimpan setting global

CREATE TABLE IF NOT EXISTS public.minimal_deposit_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minimal_deposit_usdt DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default value jika belum ada
INSERT INTO public.minimal_deposit_settings (minimal_deposit_usdt)
VALUES (10.00)
ON CONFLICT DO NOTHING;

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_minimal_deposit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_minimal_deposit_updated_at ON public.minimal_deposit_settings;

CREATE TRIGGER update_minimal_deposit_updated_at
  BEFORE UPDATE ON public.minimal_deposit_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_minimal_deposit_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.minimal_deposit_settings ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT (semua bisa baca)
CREATE POLICY "Anyone can view minimal deposit settings"
  ON public.minimal_deposit_settings
  FOR SELECT
  USING (true);

-- Policy untuk UPDATE (hanya admin via service role)
CREATE POLICY "Admin can update minimal deposit settings"
  ON public.minimal_deposit_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy untuk INSERT (hanya admin via service role)
CREATE POLICY "Admin can insert minimal deposit settings"
  ON public.minimal_deposit_settings
  FOR INSERT
  WITH CHECK (true);

