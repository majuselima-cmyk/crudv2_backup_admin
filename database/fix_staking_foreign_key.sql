-- Migration: Fix Staking Table - Add Missing Foreign Key
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Add FOREIGN KEY constraint ke staking table jika belum ada
ALTER TABLE public.staking
ADD CONSTRAINT fk_staking_member_id 
FOREIGN KEY (member_id) 
REFERENCES public.members(id) 
ON DELETE CASCADE;
