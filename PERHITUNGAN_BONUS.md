# Perhitungan Bonus Aktif

## 1. Bonus Referral

### Deskripsi
Bonus referral diberikan kepada member yang berhasil mengajak member baru untuk bergabung ke dalam sistem.

### Ketentuan
- Bonus diberikan ketika member yang direferensikan melakukan aktivitas tertentu (sesuai dengan aturan yang berlaku)
- Bonus referral biasanya diberikan dalam bentuk persentase dari nilai transaksi atau nilai tetap

### Formula Perhitungan
```
Bonus Referral = (Nilai Transaksi × Persentase Referral) atau (Nilai Tetap)
```

### Contoh
- Jika member A mengajak member B
- Member B melakukan transaksi senilai Rp 1.000.000
- Persentase bonus referral: 5%
- Maka bonus referral untuk member A = Rp 1.000.000 × 5% = Rp 50.000

---

## 2. Bonus Matching

### Deskripsi
Bonus matching diberikan kepada member berdasarkan performa downline mereka. Bonus ini biasanya dihitung berdasarkan total aktivitas atau transaksi dari seluruh downline di level tertentu.

### Ketentuan
- Bonus matching biasanya memiliki batas level tertentu (misalnya 3-5 level)
- Ada minimum requirement untuk mendapatkan bonus matching
- Bonus dihitung berdasarkan total aktivitas downline di setiap level

### Formula Perhitungan
```
Bonus Matching = Σ (Total Aktivitas Downline Level N × Persentase Matching Level N)
```

### Contoh
- Member A memiliki downline di level 1 dengan total aktivitas Rp 5.000.000
- Member A memiliki downline di level 2 dengan total aktivitas Rp 3.000.000
- Persentase matching level 1: 2%
- Persentase matching level 2: 1%
- Maka bonus matching untuk member A = (Rp 5.000.000 × 2%) + (Rp 3.000.000 × 1%) = Rp 100.000 + Rp 30.000 = Rp 130.000

---

## 3. Bonus Loyalty

### Status: ⚠️ Belum Dikerjakan

### Catatan
- Bonus loyalty akan dikembangkan di kemudian hari
- Fitur ini masih dalam tahap perencanaan

---

## Implementasi Teknis

### Database Schema (Saran)
```sql
-- Tabel Bonus Referral
CREATE TABLE bonus_referral (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT,
    referral_id INT,
    transaction_id INT,
    amount DECIMAL(10,2),
    percentage DECIMAL(5,2),
    status ENUM('pending', 'paid', 'cancelled'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Tabel Bonus Matching
CREATE TABLE bonus_matching (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT,
    level INT,
    total_activity DECIMAL(10,2),
    percentage DECIMAL(5,2),
    amount DECIMAL(10,2),
    status ENUM('pending', 'paid', 'cancelled'),
    period DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Flow Proses
1. **Bonus Referral:**
   - Trigger: Transaksi dari member yang direferensikan
   - Validasi: Cek status member, cek batas waktu, cek minimum transaksi
   - Kalkulasi: Hitung berdasarkan formula
   - Pencatatan: Simpan ke database dengan status 'pending'
   - Pencairan: Proses pembayaran sesuai jadwal

2. **Bonus Matching:**
   - Trigger: Akhir periode (harian/mingguan/bulanan)
   - Validasi: Cek minimum requirement, cek level downline
   - Kalkulasi: Agregasi aktivitas downline per level
   - Pencatatan: Simpan ke database dengan status 'pending'
   - Pencairan: Proses pembayaran sesuai jadwal

---

## Catatan Penting
- Pastikan semua perhitungan bonus dilakukan dengan akurat
- Implementasikan validasi untuk mencegah duplikasi bonus
- Buat sistem audit trail untuk tracking semua bonus yang diberikan
- Pertimbangkan batas maksimum bonus per periode
- Implementasikan sistem notifikasi untuk member yang menerima bonus

