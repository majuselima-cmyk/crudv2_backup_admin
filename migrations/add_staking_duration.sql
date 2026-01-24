-- Add staking duration column to staking table
-- Duration in minutes, default 10 minutes for testing, production minimum 1 month (43200 minutes)
ALTER TABLE staking 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 43200 NOT NULL;

-- Add default staking duration to bonus_settings table
ALTER TABLE bonus_settings 
ADD COLUMN IF NOT EXISTS default_staking_duration_minutes INTEGER DEFAULT 43200 NOT NULL;

-- Update existing staking records to have default duration (1 month = 43200 minutes)
UPDATE staking 
SET duration_minutes = 43200 
WHERE duration_minutes IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN staking.duration_minutes IS 'Duration of staking in minutes. Minimum 1 month (43200 minutes) for production. Default 10 minutes for testing.';
COMMENT ON COLUMN bonus_settings.default_staking_duration_minutes IS 'Default staking duration in minutes. Minimum 1 month (43200 minutes) for production.';

