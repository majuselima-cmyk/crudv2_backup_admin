# Perhitungan Bonus Pasif

## #Reward - Staking System

### Deskripsi
Bonus pasif adalah reward yang diberikan kepada member berdasarkan jumlah koin yang di-staking. Member akan mendapatkan reward harian berdasarkan persentase yang telah ditetapkan.

---

## Konfigurasi Default

### Settingan Database (Tabel `bonus_settings`)
- **Persentase Reward**: `0.5%` per interval (default)
  - Kolom: `reward_percentage` DECIMAL(5,2) DEFAULT 0.50
  - Digunakan untuk menghitung `reward_amount` per schedule
  
- **Reward Interval**: `60 menit` (1 jam) (default)
  - Kolom: `reward_interval_minutes` INT DEFAULT 60
  - Interval waktu antara setiap pemberian reward
  
- **Durasi Staking Default**: `43,200 menit` (1 bulan) (default)
  - Kolom: `default_staking_duration_minutes` INT DEFAULT 43200
  - Durasi default saat membuat staking baru
  
- **Status Aktif**: `true` (default)
  - Kolom: `is_active` BOOLEAN DEFAULT true
  - Mengaktifkan/menonaktifkan sistem bonus pasif

**Catatan:**
- Semua settingan dapat diubah melalui admin dashboard
- Perubahan settingan tidak mempengaruhi schedule yang sudah dibuat (untuk konsistensi)

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

### 3. Perhitungan Reward per Interval

**Formula:**
```
Reward per Interval = Jumlah Koin Staking × (Persentase Reward / 100)
```

**Contoh:**
- Member memiliki: **100 koin**
- Member melakukan staking: **100 koin** (semua koin)
- Persentase reward: **0.5%**
- Reward interval: **60 menit** (1 jam)
- Reward per interval = 100 koin × 0.5% = **0.5 koin per interval**

**Perhitungan Schedule:**
- Durasi staking: **43,200 menit** (1 bulan = 30 hari)
- Jumlah schedule: 43,200 ÷ 60 = **720 schedule**
- Total reward potensial: 0.5 × 720 = **360 koin**

**Catatan:**
- Reward hanya diberikan untuk schedule yang statusnya `paid`
- Status otomatis berubah dari `pending` ke `paid` saat waktu melewati `scheduled_time`
- Total reward dihitung dari `reward_schedules` yang statusnya `paid`

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
- Dashboard menampilkan **Total Reward Earned** (dari reward_schedules yang statusnya 'paid')
- Dashboard menampilkan statistik reward per interval
- Dashboard menampilkan jadwal reward untuk setiap staking
- Status schedule otomatis terupdate dari `pending` ke `paid` saat waktu melewati `scheduled_time`

#### 5. Reward Schedules Management
- Admin dapat melihat semua jadwal reward untuk setiap staking
- Status schedule hanya menampilkan: **Pending** dan **Paid**
- Auto-update status setiap 30 detik atau saat halaman di-refresh
- Total reward dihitung real-time dari schedule yang statusnya `paid`

---

## Database Schema

### Tabel Settings (Konfigurasi)
**Note:** Settingan reward sudah ada di tabel `bonus_settings` dengan kolom `reward_percentage` (default: 0.50)

Tabel `bonus_settings` sudah memiliki:
- `reward_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.50 - Persentase reward harian untuk staking

### Tabel Staking
```sql
CREATE TABLE staking (
    id UUID PRIMARY KEY,
    member_id UUID NOT NULL,
    coin_amount DECIMAL(18,8) NOT NULL,
    reward_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.5,
    duration_minutes INT NOT NULL DEFAULT 43200, -- Default: 1 bulan (43,200 menit)
    status ENUM('active', 'unstaked', 'cancelled') DEFAULT 'active',
    staked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unstaked_at TIMESTAMP NULL,
    total_reward_earned DECIMAL(18,8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_id (member_id),
    INDEX idx_status (status)
);
```

**Kolom Penting:**
- `duration_minutes` - Durasi staking dalam menit (default: 43,200 = 1 bulan)
- `total_reward_earned` - Total reward yang sudah dihitung (dari reward_history)
- `reward_percentage` - Persentase reward per interval (default: 0.5%)

### Tabel Reward Schedules
```sql
CREATE TABLE reward_schedules (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    staking_id UUID NOT NULL,
    member_id UUID NOT NULL,
    scheduled_time DATETIME NOT NULL,
    reward_amount DECIMAL(20,8) NOT NULL DEFAULT 0.00000000,
    status ENUM('pending', 'paid', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
    reward_history_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_staking_id (staking_id),
    INDEX idx_scheduled_time (scheduled_time),
    INDEX idx_status (status)
);
```

**Kolom Penting:**
- `scheduled_time` - Waktu kapan reward akan diberikan
- `reward_amount` - Jumlah reward yang akan diberikan
- `status` - Status schedule (pending/paid/failed/skipped)
- `reward_history_id` - Link ke reward_history jika sudah dibuat

### Tabel Reward History
```sql
CREATE TABLE reward_history (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    staking_id UUID NOT NULL,
    member_id UUID NOT NULL,
    reward_amount DECIMAL(18,8) NOT NULL,
    reward_date DATETIME NOT NULL,
    status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_id (member_id),
    INDEX idx_reward_date (reward_date),
    INDEX idx_staking_id (staking_id)
);
```

**Catatan:**
- `reward_history` dibuat oleh endpoint `process-pending-rewards` untuk tracking
- Total reward dihitung dari `reward_schedules` yang statusnya `paid`, bukan dari `reward_history`

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
7. Ambil reward_interval_minutes dari bonus_settings (default: 60 menit)
8. Ambil duration_minutes (default: 43,200 menit = 1 bulan)
9. Generate reward schedules otomatis:
   - Hitung reward_amount = coin_amount × (reward_percentage / 100)
   - Generate schedule setiap reward_interval_minutes
   - Mulai dari staked_at + reward_interval_minutes
   - Sampai staked_at + duration_minutes
   - Status awal: 'pending'
```

### 3. Reward Schedules System

Sistem menggunakan **Reward Schedules** untuk mengelola jadwal pemberian reward secara otomatis.

**Cara Kerja:**
1. **Saat Staking Dibuat:**
   - Sistem otomatis membuat jadwal reward berdasarkan:
     - `reward_interval_minutes` (default: 60 menit / 1 jam)
     - `duration_minutes` (durasi staking)
     - `reward_percentage` (persentase reward)
   - Setiap schedule memiliki `scheduled_time` dan `reward_amount`
   - Status awal: `pending`

2. **Auto-Update Status:**
   - Sistem otomatis mengupdate status dari `pending` ke `paid` ketika:
     - Waktu sekarang melebihi `scheduled_time`
     - Halaman di-refresh atau setiap 30 detik (auto-refresh)
   - Endpoint: `POST /api/admin/auto-update-schedule-status`

3. **Perhitungan Total Reward:**
   - Total Reward dihitung dari `reward_schedules` yang statusnya `paid`
   - Formula: `SUM(reward_amount) WHERE status = 'paid'`
   - Tidak menggunakan `reward_history` untuk perhitungan total

4. **Status Schedule:**
   - **Pending** - Belum waktunya (scheduled_time belum tercapai)
   - **Paid** - Sudah dibayar (scheduled_time sudah tercapai dan status terupdate)

**Keuntungan:**
- Jadwal reward konsisten dan tidak berubah
- Tracking lengkap untuk setiap jadwal reward
- Auto-update status tanpa perlu cron job
- Perhitungan total reward akurat dari schedule yang sudah paid

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

3. **Reward Schedules:**
   - Reward interval: **60 menit** (1 jam)
   - Reward per interval: 100 × 0.5% = **0.5 koin**
   - Durasi staking: **10 menit** (untuk testing)
   - Jumlah schedule: 10 schedule (setiap 1 menit)
   - Setiap schedule memiliki `scheduled_time` dan `reward_amount = 0.5`

4. **Auto-Update Status:**
   - Saat waktu sekarang melewati `scheduled_time`, status otomatis berubah dari `pending` ke `paid`
   - Total reward dihitung dari schedule yang statusnya `paid`
   - Total reward (10 schedule × 0.5) = **5 koin**

---

## API Endpoints (Saran)

### Member Endpoints
- `POST /api/member/staking` - Member melakukan staking
- `POST /api/member/unstaking` - Member melakukan unstaking
- `GET /api/member/staking/history` - Riwayat staking member
- `GET /api/member/reward/history` - Riwayat reward member

### Admin Endpoints
- `GET /api/admin/staking` - Daftar semua staking (dengan total_reward_paid)
- `POST /api/admin/staking` - Admin membuat staking untuk member (auto-generate schedules)
- `PUT /api/admin/staking/:id/unstake` - Admin melakukan unstaking untuk member
- `DELETE /api/admin/staking/:id` - Hapus staking beserta schedules dan reward_history
- `PUT /api/admin/staking/:id/reset-reward` - Reset total reward ke 0
- `GET /api/admin/reward-schedules` - Daftar semua reward schedules
- `POST /api/admin/auto-update-schedule-status` - Auto-update status schedule dari pending ke paid
- `POST /api/admin/process-pending-rewards` - Process pending rewards (buat reward_history)
- `GET /api/admin/bonus` - Get pengaturan bonus (reward_percentage, reward_interval_minutes, dll)
- `PUT /api/admin/bonus/settings` - Update pengaturan bonus

---

## Catatan Penting

1. **Validasi:**
   - Pastikan jumlah koin yang di-staking tidak melebihi available_coins
   - Validasi reward_percentage tidak boleh negatif atau terlalu besar
   - Pastikan tidak ada duplikasi reward untuk tanggal yang sama

2. **Reward Schedules System:**
   - Schedule dibuat otomatis saat staking dibuat
   - Status schedule auto-update dari `pending` ke `paid` saat waktu melewati `scheduled_time`
   - Auto-update terjadi saat:
     - Halaman di-refresh (fetchData)
     - Setiap 30 detik (auto-refresh interval)
   - Total reward dihitung dari `reward_schedules` yang statusnya `paid`
   - Tidak perlu cron job eksternal
   - Implementasikan logging untuk tracking update status

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

