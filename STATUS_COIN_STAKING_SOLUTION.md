# Solusi Perhitungan Status Coin Staking

## Kasus yang Dihadapi

**Skenario:**
1. Member deposit $100, dapat 200 coin
2. Staking 1: 200 coin → selesai → di-unstake
3. Staking 2: 200 coin → selesai → di-unstake

**Masalah:**
- Perhitungan Free coin harus akurat meskipun ada staking yang sudah di-unstake
- Perlu memastikan data konsisten antara staking active dan coin yang tersedia

## Metode Penyelesaian

### **Metode 1: Hitung dari member_coins (Recommended)**
**Konsep:**
- Gunakan `member_coins.staked_coins` untuk coin yang sedang di-staking (active)
- Gunakan `member_coins.available_coins` untuk coin free
- Data real-time, otomatis ter-update saat staking/unstake

**Kelebihan:**
- Data real-time dan akurat
- Otomatis ter-update via trigger
- Konsisten dengan database

**Kekurangan:**
- Perlu memastikan trigger di `member_coins` berjalan dengan benar
- Perlu sinkronisasi saat staking/unstake

---

### **Metode 2: Hitung Semua Staking (Termasuk yang Sudah Unstake)**
**Konsep:**
- Query semua staking (status: active, unstaked, completed)
- Total staking = SUM(coin_amount) dari semua staking yang pernah dibuat

**Kelebihan:**
- Menampilkan total historis staking
- Bisa tracking semua staking yang pernah dilakukan

**Kekurangan:**
- Tidak membedakan yang masih active vs sudah unstake
- Free coin tidak akurat (akan negatif jika sudah unstake)

---

### **Metode 3: Hitung Hanya Staking Active + History Unstake**
**Konsep:**
- Staking active: dari tabel `staking` dengan status 'active'
- Staking multiplier active: dari tabel `bonus_multiplier_staking` dengan status 'active'
- Free = `total_coin_member - (staking_active + multiplier_active)`

**Kelebihan:**
- Akurat untuk kondisi saat ini
- Mudah dihitung

**Kekurangan:**
- Tidak mencatat staking yang sudah unstake
- Free coin dihitung manual (bisa tidak sinkron dengan database)

---

### **Metode 4: Hybrid (Recommended - Implemented)**
**Konsep:**
- **Total Coin Member** = coin depo + total coin pasif + total coin aktif
  - Coin depo = `total_coin_from_deposits`
  - Total coin pasif = referral bonus coin + matching bonus coin + loyalty bonus
  - Total coin aktif = (staking reward paid + staking multiplier reward paid) dikonversi ke coin

- **Staking Active** = dari `staking` status 'active'
- **Multiplier Active** = dari `bonus_multiplier_staking` status 'active'
- **Free** = `member_coins.available_coins` (dari database, bukan dihitung manual)

**Kelebihan:**
- Menggunakan data terpusat di `member_coins`
- Free coin akurat (dari database)
- Staking active akurat (dari query real-time)
- Konsisten dengan sistem staking/unstake

**Implementasi:**
```typescript
// Total Coin Member
const totalCoinMember = totalCoinFromDeposits + totalCoinPasif + totalCoinAktif

// Staking Active (dari query)
const totalStakingCoin = SUM(coin_amount) WHERE status = 'active'

// Multiplier Active (dari query)
const totalStakingMultiplierCoin = SUM(coin_amount) WHERE status = 'active'

// Free (dari member_coins)
const freeCoins = member_coins.available_coins
```

---

## Implementasi yang Dipilih

**Metode 4 (Hybrid)** - Sudah diimplementasikan

**Alasan:**
1. Menggunakan `member_coins.available_coins` untuk Free coin (lebih akurat)
2. Staking & Multiplier dari query real-time (status 'active')
3. Total coin member dihitung dari komponen yang jelas
4. Konsisten dengan sistem database yang ada

**File yang Terlibat:**
- `admin-package/server/api/admin/members.get.ts` - Perhitungan di API
- `admin-package/pages/dashboard/members.vue` - Tampilan di frontend

---

## Catatan Penting

1. **Pastikan Trigger Berjalan:**
   - Trigger `sync_member_coins_available` harus aktif
   - `available_coins = total_coins - staked_coins` harus otomatis ter-update

2. **Sinkronisasi Saat Staking/Unstake:**
   - Saat create staking: update `staked_coins` dan `available_coins`
   - Saat unstake: kurangi `staked_coins`, tambah `available_coins`

3. **Validasi:**
   - Pastikan `available_coins` tidak negatif
   - Pastikan `staked_coins` tidak melebihi `total_coins`
