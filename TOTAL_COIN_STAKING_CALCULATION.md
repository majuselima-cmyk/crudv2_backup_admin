# Perhitungan Total Coin dengan Staking

## Kasus yang Dihadapi

**Skenario:**
1. Member deposit $100 → dapat 200 coin
2. Staking 1: 200 coin (belum di-unstake) → Free = 0
3. Reward pasif = 20 coin → Free = 20
4. Unstake → Coin member = 220 (200 depo + 20 reward)
5. Staking 2: 220 coin → Free = 0 lagi

**Pertanyaan:** Apakah logika ini benar?

**Jawaban:** ✅ **YA, BENAR!**

---

## Alur Perhitungan yang Benar

### **Step 1: Deposit**
```
Deposit: $100
Coin Price: $0.5/coin
Total Coin: 200 coin
Status:
  - total_coins = 200
  - staked_coins = 0
  - available_coins = 200 (auto via trigger)
```

### **Step 2: Staking 200 Coin**
```
Staking: 200 coin
Status:
  - total_coins = 200
  - staked_coins = 200
  - available_coins = 0 (200 - 200 = 0)
```

### **Step 3: Reward Pasif = 20 Coin (Paid)**
```
Reward Paid: 20 coin
Status:
  - total_coins = 220 (200 + 20 reward)
  - staked_coins = 200 (masih di-stake)
  - available_coins = 20 (220 - 200 = 20)
```

**Catatan Penting:** Reward yang paid harus masuk ke `total_coins` agar tersedia saat unstake.

### **Step 4: Unstake**
```
Unstake: 200 coin dikembalikan
Status:
  - total_coins = 220 (tetap, karena reward sudah masuk)
  - staked_coins = 0 (200 - 200 = 0)
  - available_coins = 220 (220 - 0 = 220)
```

### **Step 5: Staking Lagi 220 Coin**
```
Staking: 220 coin
Status:
  - total_coins = 220
  - staked_coins = 220
  - available_coins = 0 (220 - 220 = 0)
```

---

## Metode Penyelesaian

### **Metode 1: Reward Paid → Update total_coins (Recommended)**

**Konsep:**
- Saat reward paid, update `member_coins.total_coins` = `total_coins + reward_amount`
- Trigger otomatis update `available_coins = total_coins - staked_coins`

**Implementasi:**
```typescript
// Saat reward paid (process-pending-rewards.ts atau saat update status reward)
// 1. Update reward_history status = 'paid'
// 2. Update member_coins.total_coins += reward_amount
// 3. Trigger auto update available_coins
```

**Kelebihan:**
- Reward langsung masuk ke total coin
- Available coin otomatis ter-update
- Konsisten dengan sistem

**Kekurangan:**
- Perlu memastikan reward paid selalu update total_coins
- Perlu handle edge case (reward double paid, dll)

---

### **Metode 2: Reward Paid → Create Deposit Record**

**Konsep:**
- Saat reward paid, create deposit record dengan `payment_method = 'staking_reward'`
- Trigger deposit otomatis update `member_coins.total_coins`

**Implementasi:**
```typescript
// Saat reward paid
// 1. Create deposit record:
//    - amount: reward_amount (USDT)
//    - coin_amount: reward_amount / coin_price
//    - payment_method: 'staking_reward'
//    - status: 'completed'
// 2. Trigger deposit otomatis update total_coins
```

**Kelebihan:**
- Menggunakan sistem deposit yang sudah ada
- Otomatis ter-track di history
- Konsisten dengan bonus lainnya

**Kekurangan:**
- Perlu konversi reward (coin) ke USDT untuk deposit
- Bisa membingungkan di history deposit

---

### **Metode 3: Hitung Total Coin dari History (Tidak Recommended)**

**Konsep:**
- Total coin = SUM(deposits coin_amount) + SUM(reward_history reward_amount)
- Tidak simpan di `member_coins.total_coins`, hitung real-time

**Kelebihan:**
- Data selalu akurat dari source
- Tidak perlu sync

**Kekurangan:**
- Query lambat (harus hitung setiap kali)
- Tidak efisien untuk banyak member

---

## Rekomendasi: Metode 1

**Alasan:**
1. Paling efisien (update langsung ke total_coins)
2. Konsisten dengan trigger yang sudah ada
3. Available coin otomatis ter-update

**Implementasi yang Perlu Ditambahkan:**

### **1. Update process-pending-rewards.ts**
Saat reward paid, update `member_coins.total_coins`:
```typescript
// Setelah update reward_history status = 'paid'
// Update member_coins.total_coins
const { error: updateCoinsError } = await supabase
  .from('member_coins')
  .update({
    total_coins: supabase.raw('total_coins + ?', [rewardAmount])
  })
  .eq('member_id', schedule.member_id)
```

### **2. Update process-pending-multiplier-rewards.ts**
Sama seperti di atas, untuk multiplier rewards.

### **3. Pastikan Trigger Berjalan**
Trigger `sync_member_coins_available` harus aktif:
```sql
available_coins = total_coins - staked_coins
```

---

## Formula Final

**Total Coin Member:**
```
total_coin_member = coin_depo + total_coin_pasif + total_coin_aktif
```

Dimana:
- `coin_depo` = SUM(coin_amount) dari deposits dengan payment_method = 'balance'
- `total_coin_pasif` = referral bonus coin + matching bonus coin + loyalty bonus
- `total_coin_aktif` = (staking reward paid + staking multiplier reward paid) dikonversi ke coin

**Free Coin:**
```
free_coins = total_coin_member - (staking_active + multiplier_active)
```

Atau lebih akurat:
```
free_coins = member_coins.available_coins
```

---

## Validasi

Pastikan:
1. ✅ Reward paid update `total_coins`
2. ✅ Unstake kurangi `staked_coins`
3. ✅ Trigger `available_coins` berjalan
4. ✅ Free coin = `total_coins - staked_coins`

---

## Contoh Perhitungan

**Kasus:**
- Deposit: 200 coin
- Staking: 200 coin
- Reward: 20 coin (paid)
- Unstake: 200 coin

**Hasil:**
- Total coin: 220 (200 + 20)
- Staked: 0 (setelah unstake)
- Free: 220 (220 - 0)

**Staking Lagi:**
- Staking: 220 coin
- Total coin: 220
- Staked: 220
- Free: 0 (220 - 220)

✅ **Logika Benar!**
