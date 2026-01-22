# Coin Balance Calculation Fix

## Problem
When selecting a member for staking, the system showed "Member tidak memiliki koin yang tersedia untuk di-staking" (Member doesn't have available coins for staking) even though the member had both deposits and bonus aktif.

## Root Cause
The `member-coins` API endpoint was not calculating bonus aktif (active bonus/commission from downline deposits) when determining available coins for staking.

The formula was:
```
available_coins = (total_deposits - total_withdraws) / coin_price
```

But it should have been:
```
available_coins = (total_deposits - total_withdraws + bonus_aktif) / coin_price
```

## Solution
Updated `/admin-package/server/api/admin/member-coins/[memberId].get.ts` to:

1. **Fetch Bonus Aktif**: Query deposits table for all completed deposits where `payment_method` contains "bonus", "referral", or "matching"
2. **Include in Balance Calculation**: Add bonus aktif amount to the total balance before dividing by coin price
3. **Real-time Recalculation**: Both for creating new member_coins records and updating existing ones

### Code Changes

**New Logic:**
```typescript
// Calculate bonus aktif from deposits table (payment_method = referral_bonus, matching_bonus_level*)
const { data: bonusDeposits } = await supabase
  .from('deposits')
  .select('amount, payment_method, status')
  .eq('member_id', memberId)
  .eq('status', 'completed')

let totalBonusAktif = 0
if (bonusDeposits && bonusDeposits.length > 0) {
  totalBonusAktif = bonusDeposits
    .filter(d => {
      const method = String(d.payment_method || '').toLowerCase()
      return method.includes('bonus') || method.includes('referral') || method.includes('matching')
    })
    .reduce((sum, d) => sum + (parseFloat(String(d.amount || 0)) || 0), 0)
}

// Calculate remaining balance (deposit - withdraw + bonus)
const remainingBalance = Math.max(0, (totalBalance - totalWithdraw + totalBonusAktif))
const calculatedCoinBalance = coinPrice > 0 ? remainingBalance / coinPrice : totalCoinFromDeposits
```

## Example
For member `abc123`:
- Total Deposits (Completed): 40 USDT
- Total Withdraws: 0 USDT
- Bonus Aktif: 20.50 USDT (from referral_bonus and matching_bonus deposits)
- Total Balance: 40 + 0 + 20.50 = 60.50 USDT
- Coin Price (Normal): 0.5 USDT/Coin
- **Available Coins: 60.50 / 0.5 = 121 Coins** ✓ (Previously showed as 80 without bonus)

## How to Test

1. **Hard Refresh**: Press `Ctrl+F5` to clear browser cache
2. **Select Member**: Go to Bonus Pasif page and select a member with both deposits and active bonus
3. **Verify Display**: The coin balance modal should now show:
   - Total Koin: from actual deposit
   - Available Koin: including bonus aktif
4. **Check Staking**: Form should allow staking if available_coins > 0

## Files Modified
- `/admin-package/server/api/admin/member-coins/[memberId].get.ts`

## Backward Compatibility
- No database schema changes required
- Existing member_coins records will be auto-updated on next fetch
- Fully backward compatible with existing bonus aktif deposits

