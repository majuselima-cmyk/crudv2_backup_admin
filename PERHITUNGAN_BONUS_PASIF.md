# Perhitungan Bonus Pasif

## #Reward - Staking System

### Deskripsi
Bonus pasif adalah reward yang diberikan kepada member berdasarkan jumlah koin yang di-staking. Member akan mendapatkan reward harian berdasarkan persentase yang telah ditetapkan.

---

## Konfigurasi Default

### Settingan Database
- **Persentase Reward Harian**: `0.5%` per hari (default)
- Settingan disimpan di tabel `bonus_settings.reward_percentage`
- Nilai ini dapat diubah melalui admin dashboard

---

## Mekanisme Perhitungan

### 1. Konversi Deposit ke Koin

#### Member Jenis Normal
Ketika member melakukan deposit, nilai deposit akan dikonversi menjadi koin berdasarkan harga koin untuk member normal.

**Formula:**
```
Jumlah Koin = Deposit (USDT) / Harga Koin Member Normal
```

**Contoh:**
- Member normal melakukan deposit: **50 USDT**
- Harga koin member normal: **0.5 USDT per koin**
- Maka jumlah koin yang didapat = 50 USDT ÷ 0.5 USDT = **100 koin**

---

### 2. Staking Koin

Setelah member memiliki koin, mereka dapat melakukan staking. Koin yang di-staking akan menghasilkan reward harian.

**Ketentuan:**
- Member dapat melakukan staking dengan jumlah koin yang dimiliki
- Minimum staking dapat ditentukan (opsional)
- Koin yang di-staking akan terkunci dan tidak dapat digunakan untuk transaksi lain
- Reward dihitung setiap hari berdasarkan jumlah koin yang di-staking

---

### 3. Perhitungan Reward Harian

**Formula:**
```
Reward Harian = Jumlah Koin Staking × Persentase Reward Harian
```

**Contoh:**
- Member memiliki: **100 koin**
- Member melakukan staking: **100 koin** (semua koin)
- Persentase reward harian: **0.5%**
- Reward harian = 100 koin × 0.5% = **0.5 koin per hari**

**Perhitungan per periode:**
- Reward harian: 0.5 koin
- Reward mingguan (7 hari): 0.5 × 7 = **3.5 koin**
- Reward bulanan (30 hari): 0.5 × 30 = **15 koin**

---

## Fitur Admin Dashboard

### Menu: Bonus Pasif

Admin dapat mengelola sistem bonus pasif melalui dashboard dengan fitur berikut:

#### 1. Staking (Admin)
- Admin dapat melakukan staking untuk member tertentu
- Admin dapat melihat daftar semua staking aktif
- Admin dapat melihat total koin yang di-staking oleh semua member

#### 2. Unstaking (Admin)
- Admin dapat melakukan unstaking untuk member tertentu
- Admin dapat membatalkan staking sebelum periode berakhir (jika diperlukan)
- Admin dapat melihat riwayat unstaking

#### 3. Pengaturan Reward
- Admin dapat mengubah persentase reward harian melalui `bonus_settings.reward_percentage` (default: 0.5%)
- Admin dapat mengatur minimum staking
- Admin dapat mengatur periode staking (jika ada batas waktu)

#### 4. Monitoring
- Dashboard menampilkan total koin yang di-staking
- Dashboard menampilkan total reward yang telah dibagikan
- Dashboard menampilkan statistik reward harian/mingguan/bulanan

---

## Database Schema

### Tabel Settings (Konfigurasi)
**Note:** Settingan reward sudah ada di tabel `bonus_settings` dengan kolom `reward_percentage` (default: 0.50)

Tabel `bonus_settings` sudah memiliki:
- `reward_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.50 - Persentase reward harian untuk staking

### Tabel Staking
```sql
CREATE TABLE staking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    coin_amount DECIMAL(18,8) NOT NULL,
    reward_percentage DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    status ENUM('active', 'unstaked', 'cancelled') DEFAULT 'active',
    staked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unstaked_at TIMESTAMP NULL,
    staked_by INT COMMENT 'Admin yang melakukan staking',
    unstaked_by INT COMMENT 'Admin yang melakukan unstaking',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_id (member_id),
    INDEX idx_status (status)
);
```

### Tabel Reward History
```sql
CREATE TABLE reward_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staking_id INT NOT NULL,
    member_id INT NOT NULL,
    reward_amount DECIMAL(18,8) NOT NULL,
    reward_date DATE NOT NULL,
    coin_amount_staked DECIMAL(18,8) NOT NULL,
    reward_percentage DECIMAL(5,4) NOT NULL,
    status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_id (member_id),
    INDEX idx_reward_date (reward_date),
    INDEX idx_staking_id (staking_id),
    UNIQUE KEY unique_daily_reward (staking_id, reward_date)
);
```

### Tabel Member Coins
```sql
CREATE TABLE member_coins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL UNIQUE,
    total_coins DECIMAL(18,8) DEFAULT 0,
    staked_coins DECIMAL(18,8) DEFAULT 0,
    available_coins DECIMAL(18,8) DEFAULT 0,
    coin_price DECIMAL(10,4) COMMENT 'Harga koin untuk member ini',
    member_type ENUM('normal', 'premium', 'vip') DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_id (member_id)
);
```

---

## Flow Proses

### 1. Deposit dan Konversi ke Koin
```
1. Member melakukan deposit (contoh: 50 USDT)
2. Sistem mengambil harga koin berdasarkan jenis member
3. Hitung jumlah koin: Deposit ÷ Harga Koin
4. Update tabel member_coins (total_coins, available_coins)
```

### 2. Staking Process
```
1. Member/Admin memilih jumlah koin untuk di-staking
2. Validasi: Cek apakah available_coins >= jumlah koin yang akan di-staking
3. Kurangi available_coins
4. Tambah staked_coins
5. Insert record ke tabel staking dengan status 'active'
6. Ambil reward_percentage dari bonus_settings.reward_percentage (default: 0.5%)
```

### 3. Perhitungan Reward Harian (Auto Calculate)
**Tidak perlu cron job!** Reward otomatis dihitung saat:
- Admin login
- Halaman Bonus Pasif dibuka
- Manual trigger via tombol "Hitung Reward Harian"

**Flow perhitungan:**
```
1. Trigger: Admin login / Halaman dibuka / Manual trigger
2. Ambil reward_percentage dari bonus_settings.reward_percentage
3. Ambil semua staking dengan status 'active'
4. Untuk setiap staking:
   - Cek apakah reward sudah dihitung untuk hari ini (untuk mencegah duplikasi)
   - Jika belum: Hitung reward = coin_amount × reward_percentage
   - Insert ke reward_history dengan status 'pending'
5. Proses pembayaran reward (sesuai jadwal)
```

**Keuntungan:**
- Tidak perlu setup cron job eksternal
- Reward selalu up-to-date saat ada aktivitas
- Lebih sederhana untuk di-maintain
- Auto-skip jika sudah dihitung hari ini (mencegah duplikasi)

### 4. Unstaking Process
```
1. Admin/Member memilih staking yang akan di-unstake
2. Validasi: Cek status staking = 'active'
3. Update staking status menjadi 'unstaked'
4. Kurangi staked_coins
5. Tambah available_coins
6. Update unstaked_at dan unstaked_by
```

---

## Contoh Skenario Lengkap

### Skenario 1: Member Normal
1. **Deposit:**
   - Member normal deposit: **50 USDT**
   - Harga koin normal: **0.5 USDT**
   - Jumlah koin didapat: **100 koin**

2. **Staking:**
   - Member staking: **100 koin** (semua koin)
   - Reward percentage: **0.5% per hari**

3. **Reward Harian:**
   - Hari 1: 100 × 0.5% = **0.5 koin**
   - Hari 2: 100 × 0.5% = **0.5 koin**
   - Hari 3: 100 × 0.5% = **0.5 koin**
   - ... dan seterusnya

4. **Total Reward (30 hari):**
   - 0.5 koin × 30 hari = **15 koin**

---

## API Endpoints (Saran)

### Member Endpoints
- `POST /api/member/staking` - Member melakukan staking
- `POST /api/member/unstaking` - Member melakukan unstaking
- `GET /api/member/staking/history` - Riwayat staking member
- `GET /api/member/reward/history` - Riwayat reward member

### Admin Endpoints
- `POST /api/admin/staking` - Admin melakukan staking untuk member
- `POST /api/admin/unstaking` - Admin melakukan unstaking untuk member
- `GET /api/admin/staking/list` - Daftar semua staking
- `GET /api/admin/bonus/settings` - Get pengaturan bonus (termasuk reward_percentage)
- `PUT /api/admin/bonus/settings` - Update pengaturan bonus (termasuk reward_percentage)
- `GET /api/admin/reward/statistics` - Statistik reward

---

## Catatan Penting

1. **Validasi:**
   - Pastikan jumlah koin yang di-staking tidak melebihi available_coins
   - Validasi reward_percentage tidak boleh negatif atau terlalu besar
   - Pastikan tidak ada duplikasi reward untuk tanggal yang sama

2. **Auto Calculate Reward:**
   - Reward otomatis dihitung saat admin login atau halaman dibuka
   - Tidak perlu setup cron job eksternal
   - Sistem auto-skip jika reward sudah dihitung hari ini
   - Implementasikan logging untuk tracking perhitungan reward

3. **Security:**
   - Validasi permission untuk admin yang melakukan staking/unstaking
   - Audit trail untuk semua aksi admin
   - Rate limiting untuk API endpoints

4. **Performance:**
   - Index database yang tepat untuk query yang sering digunakan
   - Cache untuk settings yang jarang berubah
   - Optimasi query untuk perhitungan reward harian

5. **Notifikasi:**
   - Notifikasi ke member ketika reward harian ditambahkan
   - Notifikasi ketika staking/unstaking berhasil dilakukan

