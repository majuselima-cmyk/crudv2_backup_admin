/**
 * Test script untuk verify member-coins calculation
 * Jalankan di DevTools Console saat sudah login di admin dashboard
 */

async function testMemberCoinsCalculation(memberId) {
  try {
    console.log(`🔍 Testing member-coins endpoint for member: ${memberId}`)
    
    const response = await fetch(`/api/admin/member-coins/${memberId}`)
    const result = await response.json()
    
    if (!response.ok) {
      console.error('❌ API Error:', result)
      return
    }
    
    if (result.success && result.data) {
      const coins = result.data
      console.log('✅ API Response:')
      console.table({
        'Total Coins': coins.total_coins,
        'Staked Coins': coins.staked_coins,
        'Available Coins': coins.available_coins,
        'Coin Price': coins.coin_price,
        'Member Type': coins.member_type
      })
      
      // Show detailed breakdown
      console.log('\n📊 Breakdown:')
      console.log(`  • Total Coins (from deposits): ${coins.total_coins}`)
      console.log(`  • Staked Coins: ${coins.staked_coins}`)
      console.log(`  • Available Coins: ${coins.available_coins}`)
      console.log(`  • Coin Price: ${coins.coin_price} USDT`)
      
      if (parseFloat(coins.available_coins) > 0) {
        console.log(`  ✅ Member CAN stake (${coins.available_coins} coins available)`)
      } else {
        console.log(`  ❌ Member CANNOT stake (0 coins available)`)
      }
    } else {
      console.error('❌ Invalid response format:', result)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Example usage:
// testMemberCoinsCalculation('32167dd6-bd08-4738-91de-ac822dd417b7') // abc123

console.log('📝 Function ready. Call: testMemberCoinsCalculation("member-id")')
console.log('📝 Example: testMemberCoinsCalculation("32167dd6-bd08-4738-91de-ac822dd417b7")')
