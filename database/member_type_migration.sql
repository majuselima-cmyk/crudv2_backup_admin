-- Migration: Add Member Type Column to Members Table
-- Jalankan script ini di Supabase Dashboard → SQL Editor

-- Step 1: Drop constraint lama jika ada
ALTER TABLE public.members
DROP CONSTRAINT IF EXISTS members_member_type_check;

-- Step 2: Tambahkan kolom member_type jika belum ada (tanpa constraint dulu)
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS member_type TEXT;

-- Step 3: Update semua existing data ke 'normal' (termasuk NULL dan nilai tidak valid)
UPDATE public.members
SET member_type = 'normal'
WHERE member_type IS NULL 
   OR member_type NOT IN ('normal', 'leader', 'vip')
   OR member_type = 'biasa';

-- Step 4: Set default value dan NOT NULL
ALTER TABLE public.members
ALTER COLUMN member_type SET DEFAULT 'normal',
ALTER COLUMN member_type SET NOT NULL;

-- Step 5: Tambahkan constraint baru (normal, leader, vip)
ALTER TABLE public.members
ADD CONSTRAINT members_member_type_check 
CHECK (member_type IN ('normal', 'leader', 'vip'));

-- Step 6: Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_members_member_type ON public.members(member_type);

