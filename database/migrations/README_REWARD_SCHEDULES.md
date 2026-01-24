# Migration: Reward Schedules Table

Migration ini membuat tabel `reward_schedules` untuk menyimpan jadwal reward yang akan diberikan untuk setiap staking.

## File Migration

1. **create_reward_schedules_table.sql** - Membuat tabel `reward_schedules`
2. **create_generate_reward_schedules_function.sql** - Function/Procedure untuk generate schedule saat staking dibuat
3. **update_reward_schedule_on_payment.sql** - Trigger/Procedure untuk update schedule ketika reward diberikan
4. **migrate_existing_staking_schedules.sql** - Migration untuk staking yang sudah ada

## Cara Menggunakan

### 1. Buat Tabel Reward Schedules

```sql
-- Jalankan file create_reward_schedules_table.sql
SOURCE D:/crudv2/admin-package/database/migrations/create_reward_schedules_table.sql;
```

### 2. Buat Function/Procedure

```sql
-- Jalankan file create_generate_reward_schedules_function.sql
SOURCE D:/crudv2/admin-package/database/migrations/create_generate_reward_schedules_function.sql;
```

### 3. Buat Trigger untuk Auto Update

```sql
-- Jalankan file update_reward_schedule_on_payment.sql
SOURCE D:/crudv2/admin-package/database/migrations/update_reward_schedule_on_payment.sql;
```

### 4. Migrate Existing Staking (Jika ada staking yang sudah ada)

```sql
-- Jalankan file migrate_existing_staking_schedules.sql
SOURCE D:/crudv2/admin-package/database/migrations/migrate_existing_staking_schedules.sql;

-- Kemudian jalankan procedure untuk migrate
CALL migrate_existing_staking_schedules();
```

## Struktur Tabel

```sql
CREATE TABLE `reward_schedules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `staking_id` BIGINT UNSIGNED NOT NULL,
  `member_id` BIGINT UNSIGNED NOT NULL,
  `scheduled_time` DATETIME NOT NULL,
  `reward_amount` DECIMAL(20, 8) NOT NULL DEFAULT 0.00000000,
  `status` ENUM('pending', 'paid', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
  `reward_history_id` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  ...
);
```

## Status Schedule

- **pending** - Belum diberikan (masih menunggu waktu)
- **paid** - Sudah dibayar (reward sudah diberikan)
- **failed** - Gagal diberikan
- **skipped** - Dilewati (tidak diberikan)

## Penggunaan di Backend API

### Saat Membuat Staking Baru

```javascript
// Setelah staking dibuat, generate schedules
await db.query(`
  CALL generate_reward_schedules(
    ?, -- staking_id
    ?, -- member_id
    ?, -- staked_at
    ?, -- duration_minutes
    ?, -- reward_percentage
    ?, -- coin_amount
    ?  -- reward_interval_minutes
  )
`, [stakingId, memberId, stakedAt, durationMinutes, rewardPercentage, coinAmount, rewardIntervalMinutes]);
```

### Query Schedule untuk Staking

```sql
-- Ambil semua schedule untuk staking tertentu
SELECT * FROM reward_schedules 
WHERE staking_id = ? 
ORDER BY scheduled_time ASC;

-- Ambil schedule yang sudah paid
SELECT * FROM reward_schedules 
WHERE staking_id = ? AND status = 'paid'
ORDER BY scheduled_time ASC;

-- Hitung total reward yang sudah paid
SELECT SUM(reward_amount) as total_paid
FROM reward_schedules 
WHERE staking_id = ? AND status = 'paid';
```

## Keuntungan

1. **Konsistensi** - Jadwal tidak berubah meskipun setting interval berubah
2. **Tracking** - Bisa melihat jadwal yang sudah dibuat vs yang belum
3. **Audit Trail** - Riwayat jadwal tersimpan di database
4. **Perhitungan Akurat** - Total reward dihitung dari schedule yang sudah paid
5. **Performance** - Tidak perlu menghitung schedule setiap kali di frontend

## Catatan

- Schedule dibuat otomatis saat staking dibuat
- Status schedule diupdate otomatis ketika reward history dibuat/diupdate (via trigger)
- Jika interval reward berubah, schedule yang sudah dibuat tidak berubah (untuk konsistensi)
- Schedule untuk staking yang sudah unstaked tetap ada untuk tracking

