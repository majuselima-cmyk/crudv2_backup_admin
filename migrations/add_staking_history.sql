-- Create staking_history table to track all staking and unstaking activities
CREATE TABLE IF NOT EXISTS staking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staking_id UUID NOT NULL REFERENCES staking(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL, -- 'created', 'unstaked', 'auto_unstaked', 'deleted'
  coin_amount NUMERIC(20, 8) NOT NULL,
  reward_percentage NUMERIC(5, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  staked_at TIMESTAMPTZ,
  unstaked_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_staking_history_member_id ON staking_history(member_id);
CREATE INDEX IF NOT EXISTS idx_staking_history_staking_id ON staking_history(staking_id);
CREATE INDEX IF NOT EXISTS idx_staking_history_created_at ON staking_history(created_at DESC);

-- Add comment
COMMENT ON TABLE staking_history IS 'History log untuk semua aktivitas staking dan unstaking';
COMMENT ON COLUMN staking_history.action IS 'Jenis aksi: created, unstaked, auto_unstaked, deleted';

