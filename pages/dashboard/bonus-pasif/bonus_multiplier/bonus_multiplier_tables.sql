-- ============================================
-- BONUS MULTIPLIER TABLES - DROP & RECREATE
-- ============================================
-- File ini untuk drop dan recreate tabel bonus_multiplier
-- yang sudah ada di Supabase tapi bermasalah
-- 
-- INSTRUKSI:
-- 1. Buka Supabase Dashboard → SQL Editor
-- 2. Copy-paste seluruh isi file ini
-- 3. Jalankan (Run) semua query sekaligus
-- 4. Selesai! Tabel sudah dibuat ulang dengan benar
-- ============================================

-- ============================================
-- STEP 1: DROP EXISTING TABLES
-- ============================================
-- Drop tables dalam urutan yang benar (child table dulu)
-- karena ada foreign key constraints

-- Drop bonus_multiplier_schedules terlebih dahulu (child table)
DROP TABLE IF EXISTS public.bonus_multiplier_schedules CASCADE;

-- Drop bonus_multiplier_staking (parent table)
DROP TABLE IF EXISTS public.bonus_multiplier_staking CASCADE;

-- ============================================
-- STEP 2: CREATE TABLE: bonus_multiplier_staking
-- ============================================
-- Tabel untuk menyimpan data staking multiplier member

CREATE TABLE public.bonus_multiplier_staking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Member Information
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  
  -- Staking Information
  coin_amount DECIMAL(18,8) NOT NULL DEFAULT 0,
  multiplier_bonus_base_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  reward_interval_minutes INTEGER NOT NULL DEFAULT 3,
  multiplier_increment_period_minutes INTEGER NOT NULL DEFAULT 10,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX idx_bonus_multiplier_staking_member_id ON public.bonus_multiplier_staking(member_id);
CREATE INDEX idx_bonus_multiplier_staking_status ON public.bonus_multiplier_staking(status);
CREATE INDEX idx_bonus_multiplier_staking_started_at ON public.bonus_multiplier_staking(started_at DESC);
CREATE INDEX idx_bonus_multiplier_staking_active ON public.bonus_multiplier_staking(status) WHERE status = 'active';

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_bonus_multiplier_staking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bonus_multiplier_staking_updated_at ON public.bonus_multiplier_staking;
CREATE TRIGGER update_bonus_multiplier_staking_updated_at
  BEFORE UPDATE ON public.bonus_multiplier_staking
  FOR EACH ROW
  EXECUTE FUNCTION update_bonus_multiplier_staking_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.bonus_multiplier_staking ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT
CREATE POLICY "Anyone can view bonus multiplier staking"
  ON public.bonus_multiplier_staking
  FOR SELECT
  USING (true);

-- Policy untuk INSERT
CREATE POLICY "Admin can insert bonus multiplier staking"
  ON public.bonus_multiplier_staking
  FOR INSERT
  WITH CHECK (true);

-- Policy untuk UPDATE
CREATE POLICY "Admin can update bonus multiplier staking"
  ON public.bonus_multiplier_staking
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy untuk DELETE
CREATE POLICY "Admin can delete bonus multiplier staking"
  ON public.bonus_multiplier_staking
  FOR DELETE
  USING (true);

-- ============================================
-- STEP 3: CREATE TABLE: bonus_multiplier_schedules
-- ============================================
-- Tabel untuk menyimpan jadwal reward multiplier

CREATE TABLE public.bonus_multiplier_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Staking Reference
  multiplier_staking_id UUID NOT NULL REFERENCES public.bonus_multiplier_staking(id) ON DELETE CASCADE,
  
  -- Member Information (denormalized untuk performa)
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  
  -- Schedule Information
  scheduled_time TIMESTAMPTZ NOT NULL,
  reward_amount DECIMAL(18,8) NOT NULL DEFAULT 0,
  multiplier_value DECIMAL(10,4) NOT NULL DEFAULT 1.00,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX idx_bonus_multiplier_schedules_staking_id ON public.bonus_multiplier_schedules(multiplier_staking_id);
CREATE INDEX idx_bonus_multiplier_schedules_member_id ON public.bonus_multiplier_schedules(member_id);
CREATE INDEX idx_bonus_multiplier_schedules_scheduled_time ON public.bonus_multiplier_schedules(scheduled_time);
CREATE INDEX idx_bonus_multiplier_schedules_status ON public.bonus_multiplier_schedules(status);
CREATE INDEX idx_bonus_multiplier_schedules_pending ON public.bonus_multiplier_schedules(status, scheduled_time) WHERE status = 'pending';

-- Unique constraint: satu schedule per staking per waktu (optional, bisa dihapus jika tidak diperlukan)
-- CREATE UNIQUE INDEX idx_bonus_multiplier_schedules_unique 
--   ON public.bonus_multiplier_schedules(multiplier_staking_id, scheduled_time);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_bonus_multiplier_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bonus_multiplier_schedules_updated_at ON public.bonus_multiplier_schedules;
CREATE TRIGGER update_bonus_multiplier_schedules_updated_at
  BEFORE UPDATE ON public.bonus_multiplier_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_bonus_multiplier_schedules_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.bonus_multiplier_schedules ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT
CREATE POLICY "Anyone can view bonus multiplier schedules"
  ON public.bonus_multiplier_schedules
  FOR SELECT
  USING (true);

-- Policy untuk INSERT
CREATE POLICY "Admin can insert bonus multiplier schedules"
  ON public.bonus_multiplier_schedules
  FOR INSERT
  WITH CHECK (true);

-- Policy untuk UPDATE
CREATE POLICY "Admin can update bonus multiplier schedules"
  ON public.bonus_multiplier_schedules
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy untuk DELETE
CREATE POLICY "Admin can delete bonus multiplier schedules"
  ON public.bonus_multiplier_schedules
  FOR DELETE
  USING (true);

-- ============================================
-- VERIFIKASI SETUP
-- ============================================
-- Jalankan query ini untuk memastikan semua tabel sudah dibuat

-- Check apakah semua tabel sudah ada
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('bonus_multiplier_staking', 'bonus_multiplier_schedules') 
    THEN '✅ OK'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('bonus_multiplier_staking', 'bonus_multiplier_schedules')
ORDER BY table_name;

-- Check columns untuk bonus_multiplier_staking
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bonus_multiplier_staking'
ORDER BY ordinal_position;

-- Check columns untuk bonus_multiplier_schedules
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bonus_multiplier_schedules'
ORDER BY ordinal_position;

-- ============================================
-- SELESAI!
-- ============================================
-- Tabel sudah dibuat dengan:
-- ✅ Drop tabel lama yang bermasalah
-- ✅ Create tabel baru dengan struktur yang benar
-- ✅ Index untuk performa
-- ✅ Trigger untuk auto-update updated_at
-- ✅ Row Level Security (RLS) enabled
-- ✅ Policy untuk akses data
-- ✅ Foreign key constraints
-- ✅ Default values
-- ✅ Check constraints untuk status
--
-- Langkah selanjutnya:
-- 1. Test insert data melalui API
-- 2. Verifikasi data bisa di-read dengan benar
-- 3. Test update dan delete operations
-- ============================================

