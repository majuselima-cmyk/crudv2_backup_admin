-- Migration: Add tx_hash and verification_status to deposits
-- Run this in Supabase SQL Editor

ALTER TABLE public.deposits 
ADD COLUMN IF NOT EXISTS tx_hash TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'manual';

-- Add unique constraint to tx_hash to prevent double spending
-- We use a partial index or just a unique index. 
-- Note: User might re-submit failed hash, so maybe unique is tricky if we don't handle rejection/deletion properly.
-- But for security, a COMPLETED deposit must have a unique hash.
-- Let's make it Unique for now, if user mistakes they can delete or we handle it in API.

CREATE UNIQUE INDEX IF NOT EXISTS idx_deposits_tx_hash ON public.deposits(tx_hash) WHERE tx_hash IS NOT NULL;

COMMENT ON COLUMN public.deposits.tx_hash IS 'Transaction Hash from Blockchain (BscScan/Etherscan)';
COMMENT ON COLUMN public.deposits.verification_status IS 'Status verifikasi hash: manual, auto_pending, auto_success';
