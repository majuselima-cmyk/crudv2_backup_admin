# Perhitungan Withdraw (WD)

## 1. Balance USDT (Bonus Referral)

### Saldo Bonus Referral USDT
```
Saldo = Referral Bonus USDT (80%) + Matching Bonus USDT (80%)
```

### Total USDT WD
```
Total WD = SUM(amount) dari tabel withdraws 
WHERE member_id = member.id 
AND withdraw_category = 'bonus_referral' 
AND status IN ('completed', 'pending')
```

### Sisa Bonus Referral Ready WD
```
Sisa = Saldo Bonus Referral USDT - Total USDT WD
```

**Contoh:**
- Saldo: 125,60 USDT
- Total WD: 0 USDT
- **Sisa Ready WD: 125,60 USDT**

---

## 2. Coin Withdraw

### Total Coin Member
```
Total Coin = Coin Deposit + Total Coin Pasif + Total Coin Aktif
```

### Coin Ready WD
```
Coin Ready WD = Total Coin Member - (Staking + Staking Multiplier)
```

### WD Coin
```
WD Coin = SUM(amount_coin) dari tabel withdraws 
WHERE member_id = member.id 
AND status IN ('completed', 'pending')
```

### Sisa Coin
```
Sisa Coin = Coin Ready WD - WD Coin
```

**Contoh:**
- Total Coin Member: 262,80 MYC001
- Staking: 262,80 MYC001
- Multiplier: 0 MYC001
- Coin Ready WD: 0 MYC001 (262,80 - 262,80)
- WD Coin: 0 MYC001
- **Sisa Coin: 0 MYC001**

---

## 3. Form Withdraw

### Balance USDT
- **Auto-fill Amount**: Sisa Bonus Referral Ready WD
- **Max Amount**: Sisa Bonus Referral Ready WD

### Coin
- **Auto-fill Amount Coin**: Sisa Coin
- **Max Amount Coin**: Sisa Coin
- **Convert USDT**: Sisa Coin × Harga Coin (sesuai member_type)

---

## 4. Kategori Withdraw

### withdraw_category
- `'bonus_referral'`: Untuk withdraw Balance USDT (dari bonus pasif referral 80% + matching 80%)
- `'coin'`: Untuk withdraw Coin

### withdraw_type
- `'balance'`: Withdraw Balance USDT
- `'coin'`: Withdraw Coin

---

## 5. Tabel Members - Status Bonus Referral Withdraw

Menampilkan:
1. **Saldo Bonus Referral USDT**: Referral 80% + Matching 80%
2. **Total USDT WD**: Total withdraw USDT dari bonus referral
3. **Sisa Bonus Referral**: Saldo - Total WD (dengan badge hijau)

---

## 6. Tabel Members - Status Coin Withdraw

Menampilkan:
1. **Coin Ready WD**: Total Coin Member - (Staking + Multiplier) (dengan badge hijau)
2. **WD Coin**: Total coin yang sudah di-withdraw
3. **Sisa Coin**: Coin Ready WD - WD Coin

---

## Catatan Penting

- **Status Withdraw**: Hanya `'completed'` dan `'pending'` yang dihitung (exclude `'rejected'`)
- **Harga Coin**: Berbeda sesuai `member_type`:
  - Normal: `normal_price_usdt`
  - VIP: `vip_price_usdt`
  - Leader: `leader_price_usdt`
- **Sisa yang Ready**: Selalu dihitung dengan `Math.max(0, ...)` untuk menghindari nilai negatif
