-- ============================================
-- BONUS PASSIVE ARCHITECTURE
-- ============================================

-- 1. BASIC BALANCE (dari deposits & bonuses)
-- Table: member_coins
-- Columns:
--   - total_coins (USDT balance / coin_price)
--   - staked_coins (coins yang di-stake)
--   - available_coins (total - staked) ← AUTO via trigger
--   - coin_price (dari coin_settings)

-- 2. PASSIVE BONUSES (referral, matching, loyalty)
-- Stored in: deposits table dengan payment_method
--   payment_method IN ('referral_bonus', 'matching_bonus_level1', 'matching_bonus_level2', 'matching_bonus_level3', 'loyalty_bonus')
-- Trigger: update member_coins.total_coins saat ada deposit baru

-- 3. STAKING & REWARD
-- Table: staking (manual insert via API admin)
--   - member_id
--   - coin_amount (jumlah coin di-stake)
--   - reward_percentage (dari bonus_settings)
--   - status (active/unstaked)
--
-- Table: reward_history (auto insert via daily job)
--   - staking_id
--   - member_id
--   - reward_amount (coin_amount * reward_percentage / 100)
--   - reward_date (hari reward dihitung)
--   - status (pending/paid)
--
-- Process:
--   1. Admin create staking → coin di-move ke staked_coins
--   2. Daily job (cron atau API call) → hitung reward → insert ke reward_history
--   3. Reward bisa di-claim / auto masuk ke balance (perlu config)

-- ============================================
-- CALCULATION: Ketika Deposit 50 USDT
-- ============================================
-- 1. Ambil coin_price dari coin_settings (misal 0.5 USDT/coin)
-- 2. coin_amount = 50 / 0.5 = 100 coin
-- 3. INSERT deposits (amount: 50, status: completed, payment_method: 'balance')
-- 4. UPDATE member_coins SET total_coins = total_coins + 100
-- 5. available_coins auto jadi: total_coins - staked_coins (via trigger)

-- ============================================
-- CALCULATION: Ketika Ada Staking
-- ============================================
-- 1. Admin set 50 coin untuk di-stake
-- 2. UPDATE member_coins SET staked_coins = staked_coins + 50
--    → available_coins auto update via trigger
-- 3. Daily job hitung: reward = 50 * reward_percentage / 100
--    (misal reward_percentage = 0.5% = 0.005)
--    reward = 50 * 0.005 = 0.25 coin per hari
-- 4. INSERT reward_history setiap hari

-- ============================================
-- TRIGGER UNTUK AUTO CALCULATION
-- ============================================

-- Trigger 1: Auto update total_coins saat deposit (semua tipe)
CREATE OR REPLACE FUNCTION auto_update_coins_on_deposit()
RETURNS TRIGGER AS $$
DECLARE
  v_coin_price DECIMAL(10,4);
  v_coin_amount DECIMAL(18,8);
BEGIN
  -- Hanya proses jika status completed
  IF NEW.status = 'completed' THEN
    -- Ambil coin price dari coin_settings
    SELECT COALESCE(price_per_coin_usdt, 0.5) INTO v_coin_price
    FROM coin_settings
    LIMIT 1;
    
    -- Hitung coin amount
    IF v_coin_price > 0 THEN
      v_coin_amount := NEW.amount / v_coin_price;
    ELSE
      v_coin_amount := 0;
    END IF;
    
    -- Update atau insert ke member_coins
    INSERT INTO member_coins (member_id, total_coins, staked_coins, available_coins, coin_price)
    VALUES (NEW.member_id, v_coin_amount, 0, v_coin_amount, v_coin_price)
    ON CONFLICT (member_id) DO UPDATE SET
      total_coins = member_coins.total_coins + v_coin_amount,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_auto_update_coins_on_deposit
  AFTER INSERT OR UPDATE ON deposits
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_coins_on_deposit();

-- Trigger 2: Auto sync available_coins = total_coins - staked_coins
CREATE OR REPLACE FUNCTION sync_available_coins()
RETURNS TRIGGER AS $$
BEGIN
  NEW.available_coins := NEW.total_coins - NEW.staked_coins;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sync_available_coins
  BEFORE INSERT OR UPDATE ON member_coins
  FOR EACH ROW
  EXECUTE FUNCTION sync_available_coins();
