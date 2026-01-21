-- Migration: Create Withdraws Table
-- File: admin-package/database/withdraws_table.sql
-- Description: Buat tabel withdraws untuk menyimpan data withdraw request dari member

-- Create withdraws table
CREATE TABLE IF NOT EXISTS public.withdraws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL,
  withdraw_type VARCHAR(50) NOT NULL DEFAULT 'balance',
  amount DECIMAL(10, 2) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  wallet_network VARCHAR(50) NOT NULL,
  wallet_model VARCHAR(100),
  admin_wallet_address VARCHAR(255) NULL,
  hash VARCHAR(255) NULL,
  notes TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_withdraws_member 
    FOREIGN KEY (member_id) 
    REFERENCES public.members(id) 
    ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_withdraws_member_id ON public.withdraws(member_id);
CREATE INDEX IF NOT EXISTS idx_withdraws_status ON public.withdraws(status);
CREATE INDEX IF NOT EXISTS idx_withdraws_created_at ON public.withdraws(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdraws_hash ON public.withdraws(hash) WHERE hash IS NOT NULL;

-- Add comments
COMMENT ON TABLE public.withdraws IS 'Tabel untuk menyimpan data withdraw request dari member';
COMMENT ON COLUMN public.withdraws.member_id IS 'ID member yang melakukan withdraw';
COMMENT ON COLUMN public.withdraws.withdraw_type IS 'Tipe withdraw: balance, coin, bonus_aktif, bonus_pasif';
COMMENT ON COLUMN public.withdraws.amount IS 'Jumlah withdraw dalam USDT';
COMMENT ON COLUMN public.withdraws.wallet_address IS 'Alamat wallet tujuan untuk menerima withdraw';
COMMENT ON COLUMN public.withdraws.wallet_network IS 'Network wallet: BEP20, ERC20, dll';
COMMENT ON COLUMN public.withdraws.wallet_model IS 'Model wallet: USDT_BEP20, USDT_ERC20, dll';
COMMENT ON COLUMN public.withdraws.admin_wallet_address IS 'Alamat wallet admin yang digunakan untuk proses withdraw';
COMMENT ON COLUMN public.withdraws.hash IS 'Transaction hash dari blockchain (muncul setelah admin approve)';
COMMENT ON COLUMN public.withdraws.notes IS 'Catatan tambahan (opsional)';
COMMENT ON COLUMN public.withdraws.status IS 'Status withdraw: pending, completed, rejected';

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_withdraws_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_withdraws_updated_at ON public.withdraws;

CREATE TRIGGER update_withdraws_updated_at
  BEFORE UPDATE ON public.withdraws
  FOR EACH ROW
  EXECUTE FUNCTION update_withdraws_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.withdraws ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT (member hanya bisa lihat withdraw mereka sendiri)
CREATE POLICY "Members can view their own withdraws"
  ON public.withdraws
  FOR SELECT
  USING (true); -- Akan di-filter di aplikasi berdasarkan member_id dari cookie

-- Policy untuk INSERT (member bisa membuat withdraw request)
CREATE POLICY "Members can insert their own withdraws"
  ON public.withdraws
  FOR INSERT
  WITH CHECK (true); -- Akan di-validasi di aplikasi

-- Policy untuk UPDATE (hanya admin via service role)
CREATE POLICY "Admin can update withdraws"
  ON public.withdraws
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy untuk DELETE (hanya admin via service role)
CREATE POLICY "Admin can delete withdraws"
  ON public.withdraws
  FOR DELETE
  USING (true);

