-- Migration: Add amount_coin column to withdraws table
-- File: admin-package/database/withdraws_add_amount_coin.sql
-- Description: Tambahkan kolom amount_coin ke tabel withdraws untuk menyimpan jumlah coin yang di-withdraw

-- Add amount_coin column to withdraws table
ALTER TABLE public.withdraws 
ADD COLUMN IF NOT EXISTS amount_coin DECIMAL(18,8) NULL;

-- Add comment for the new column
COMMENT ON COLUMN public.withdraws.amount_coin IS 'Jumlah withdraw dalam coin (MYC001 atau coin code lainnya)';

-- Update existing records: calculate amount_coin from amount if coin_price is available
-- Note: This is a placeholder - actual calculation should be done based on coin_price at the time of withdraw
-- For now, set to NULL and let the application calculate it when needed
UPDATE public.withdraws 
SET amount_coin = NULL 
WHERE amount_coin IS NULL;

-- Create index for faster queries (optional, jika diperlukan untuk search)
CREATE INDEX IF NOT EXISTS idx_withdraws_amount_coin ON public.withdraws(amount_coin) WHERE amount_coin IS NOT NULL;
