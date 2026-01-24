-- Function to calculate total referral bonus for a member
-- This function calculates the sum of referral bonuses from all deposits made by downlines
-- 
-- Parameters:
--   p_member_id: UUID of the member
--   p_referral_percentage: Percentage of referral bonus (default: 15%)
--
-- Returns:
--   total_referral_bonus: Total referral bonus in USDT

CREATE OR REPLACE FUNCTION get_member_referral_bonus(
  p_member_id UUID,
  p_referral_percentage DECIMAL(5,2) DEFAULT 15.00
)
RETURNS TABLE (
  total_referral_bonus DECIMAL(15,8)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_bonus DECIMAL(15,8) := 0;
BEGIN
  -- Calculate total referral bonus from all completed deposits made by downlines
  -- Formula: SUM(deposit.amount * referral_percentage / 100)
  SELECT COALESCE(SUM(d.amount * p_referral_percentage / 100), 0)
  INTO v_total_bonus
  FROM deposits d
  INNER JOIN members m ON d.member_id = m.id
  WHERE m.referred_by = p_member_id
    AND d.status = 'completed';
  
  RETURN QUERY SELECT v_total_bonus;
END;
$$;

-- Add comment
COMMENT ON FUNCTION get_member_referral_bonus(UUID, DECIMAL) IS 
'Calculate total referral bonus for a member from all completed deposits made by their downlines';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_member_referral_bonus(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_referral_bonus(UUID, DECIMAL) TO anon;

