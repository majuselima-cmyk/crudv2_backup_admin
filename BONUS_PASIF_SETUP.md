# Setup Bonus Pasif - Required Migrations

Sebelum bisa menggunakan fitur Bonus Pasif (Staking), pastikan sudah jalankan semua SQL migration berikut di Supabase Dashboard → SQL Editor.

## Urutan Migration (PENTING!):

### 1. Create bonus_settings table
Jalankan: `admin-package/database/bonus_settings_table.sql`

```bash
# Di Supabase Dashboard → SQL Editor, copy-paste seluruh isi file tersebut
```

### 2. Create staking table  
Jalankan: `admin-package/database/staking_table.sql`

### 3. Create reward_history table
Jalankan: `admin-package/database/reward_history_table.sql`

### 4. Create member_coins table
Jalankan: `admin-package/database/member_coins_table.sql`

## Verifikasi Sudah Berhasil:

Setelah menjalankan semua migration, pastikan tabel-tabel berikut ada di Supabase:
- ✅ `bonus_settings` - Pengaturan bonus
- ✅ `staking` - Data staking member
- ✅ `reward_history` - Riwayat reward
- ✅ `member_coins` - Koin member

## Check Database:

Jalankan query ini di Supabase SQL Editor untuk verify:

```sql
-- Check apakah tabel sudah ada
SELECT * FROM information_schema.tables 
WHERE table_name IN ('bonus_settings', 'staking', 'reward_history', 'member_coins');
```

Seharusnya return 4 rows.

## Jika Ada Error:

- **"relation does not exist"** → Jalankan semua SQL migration di atas
- **"Could not find a relationship"** → Sudah fixed di code, refresh page
- **500 Error pada API** → Check Supabase logs, pastikan table ada

## Setelah Setup:

1. Refresh page admin
2. Bonus Pasif menu seharusnya bisa load tanpa error
3. Member list akan muncul di select dropdown

Butuh bantuan? Check error di browser console (F12 → Console tab)
