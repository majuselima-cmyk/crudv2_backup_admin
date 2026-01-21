-- Migration: Add admin_wallet_address field to withdraws table
-- File: admin-package/database/withdraws_add_admin_wallet_address.sql
-- Description: Tambahkan field admin_wallet_address ke tabel withdraws untuk menyimpan alamat wallet admin

-- Add admin_wallet_address column to withdraws table
ALTER TABLE public.withdraws 
ADD COLUMN IF NOT EXISTS admin_wallet_address VARCHAR(255) NULL;

-- Add comment for the new column
COMMENT ON COLUMN public.withdraws.admin_wallet_address IS 'Alamat wallet admin yang digunakan untuk proses withdraw';

-- Create index for faster queries (optional, jika diperlukan untuk search)
CREATE INDEX IF NOT EXISTS idx_withdraws_admin_wallet_address ON public.withdraws(admin_wallet_address) WHERE admin_wallet_address IS NOT NULL;

