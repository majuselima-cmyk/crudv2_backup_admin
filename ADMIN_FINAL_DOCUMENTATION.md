# Admin Dashboard - Dokumentasi Final

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Struktur Project](#struktur-project)
3. [Halaman Dashboard](#halaman-dashboard)
4. [Fitur Utama](#fitur-utama)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Perhitungan Penting](#perhitungan-penting)
8. [Migration Files](#migration-files)
9. [Cara Penggunaan](#cara-penggunaan)
10. [Development Guide](#development-guide)

---

## Overview

Admin Dashboard adalah aplikasi manajemen lengkap untuk mengelola sistem referral, bonus, staking, coin, deposit, dan withdraw. Dibangun dengan **Nuxt 3**, **Vue 3**, **TypeScript**, dan **Supabase** sebagai backend.

### Teknologi Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Styling**: Tailwind CSS dengan custom components
- **Icons**: Custom Icon component
- **State Management**: Vue 3 Composition API (ref, computed, reactive)

### Fitur Utama

✅ **Manajemen Member** - CRUD member, lihat detail bonus, referral network  
✅ **Manajemen Bonus** - Bonus aktif (referral, matching, loyalty) dan bonus pasif (staking, multiplier)  
✅ **Manajemen Coin** - Pengaturan harga coin, staking, multiplier staking  
✅ **Manajemen Deposit** - Rekap deposit, approve/reject deposit  
✅ **Manajemen Withdraw** - Rekap withdraw, create withdraw (Balance USDT & Coin)  
✅ **Manajemen Wallet** - Admin wallet addresses (BEP20, ERC20)  
✅ **Dashboard Statistics** - Total member, total deposit, total withdraw  
✅ **Settings** - Pengaturan sistem (bonus settings, coin settings, minimal deposit, gas-free withdraw)

---

## Struktur Project

```
admin-package/
├── pages/
│   ├── index.vue                    # Login page
│   └── dashboard/
│       ├── index.vue                # Dashboard utama (statistics cards)
│       ├── members.vue              # Manajemen member (CRUD + detail)
│       ├── bonus.vue                # Pengaturan bonus
│       ├── bonus-active-report.vue  # Laporan bonus aktif
│       ├── bonus-pasif/             # Bonus pasif management
│       │   ├── index.vue
│       │   ├── members.vue
│       │   ├── staking.vue
│       │   ├── bonus-multiplier.vue
│       │   └── staking-multiplier.vue
│       ├── coin.vue                 # Pengaturan coin
│       ├── deposits.vue             # Rekap deposit
│       ├── withdraws.vue            # Rekap withdraw + create withdraw
│       ├── wallet.vue               # Manajemen wallet admin
│       ├── gas-free-withdraw.vue    # Pengaturan gas-free withdraw
│       ├── minimal-deposit.vue      # Pengaturan minimal deposit
│       ├── settings.vue             # Pengaturan umum
│       └── data.vue                 # Manajemen data (placeholder)
│
├── components/
│   ├── Sidebar.vue                  # Sidebar navigation
│   ├── MobileHeader.vue             # Mobile header dengan menu toggle
│   ├── Icon.vue                     # Icon component
│   ├── MemberSelect.vue             # Component untuk select member
│   └── MembersReferralsModal.vue    # Modal untuk lihat referral network
│
├── server/
│   └── api/
│       └── admin/                    # API endpoints untuk admin
│           ├── members.get.ts       # Get all members
│           ├── members.post.ts      # Create member
│           ├── members/[id].put.ts  # Update member
│           ├── members/[id].delete.ts # Delete member
│           ├── withdraws.get.ts     # Get all withdraws
│           ├── withdraws.post.ts    # Create withdraw
│           ├── withdraw-recap.get.ts # Get withdraw recap
│           ├── withdraw-stats.get.ts  # Get statistics (member, deposit, withdraw)
│           ├── bonus.get.ts         # Get bonus settings
│           ├── bonus.put.ts         # Update bonus settings
│           ├── coin.get.ts          # Get coin settings
│           ├── coin.put.ts          # Update coin settings
│           ├── wallet.get.ts        # Get wallet addresses
│           ├── wallet.post.ts       # Create wallet
│           ├── wallet/[id].put.ts   # Update wallet
│           ├── wallet/[id].delete.ts # Delete wallet
│           ├── deposits.get.ts      # Get deposits
│           ├── deposits.post.ts     # Create deposit
│           ├── staking.get.ts       # Get staking data
│           ├── staking.post.ts      # Create staking
│           ├── process-pending-rewards.ts # Process staking rewards
│           ├── process-pending-multiplier-rewards.post.ts # Process multiplier rewards
│           └── ... (43 API endpoints total)
│
├── database/                        # SQL migration files
│   ├── withdraws_add_amount_coin.sql
│   ├── withdraws_add_withdraw_category.sql
│   ├── bonus_settings_table.sql
│   ├── coin_settings_table.sql
│   ├── member_coins_table.sql
│   ├── staking_table.sql
│   ├── reward_history_table.sql
│   └── ... (30+ migration files)
│
├── layouts/
│   └── admin.vue                    # Admin layout wrapper
│
├── composables/
│   └── useSupabase.ts              # Supabase client composable
│
├── utils/
│   └── supabase.ts                 # Supabase utilities
│
├── types/
│   └── database.types.ts           # TypeScript types untuk database
│
├── assets/
│   └── css/
│       └── main.css                # Tailwind CSS
│
├── WITHDRAW_CALCULATION.md         # Dokumentasi perhitungan withdraw
├── TOTAL_COIN_STAKING_CALCULATION.md # Dokumentasi perhitungan coin staking
└── ADMIN_FINAL_DOCUMENTATION.md    # Dokumentasi ini
```

---

## Halaman Dashboard

### 1. Dashboard Utama (`/dashboard`)

**File**: `pages/dashboard/index.vue`

**Fitur**:
- **Statistics Cards** (3 cards):
  - **Total Member**: Jumlah member terdaftar (gradient biru)
  - **Total Deposit**: Total USDT dari deposit (gradient hijau)
  - **Total Withdraw**: Total USDT yang di-withdraw (gradient ungu)
- Data diambil dari API `/api/admin/withdraw-stats`
- Responsive design dengan hover effects

---

### 2. Manajemen Member (`/dashboard/members`)

**File**: `pages/dashboard/members.vue`

**Fitur**:
- **Tabel Member** dengan kolom:
  - Member Info (Nama, Email, Referral Code, Status)
  - Deposit Info (USDT, Coin)
  - **Bonus Aktif**:
    - Reward Staking (coin + convert USDT)
    - Reward Staking Multiplier (coin + convert USDT)
  - **Bonus Pasif**:
    - USDT (referral 80% + matching 80%)
    - Coin (referral 20% + matching 20%)
    - Loyalty (coin)
  - **Status Coin Staking**:
    - Total Coin Member
    - Staking (coin)
    - Multiplier (coin)
    - Free (coin)
  - **Status Coin Withdraw**:
    - Coin Ready WD (badge hijau)
    - WD Coin
    - Sisa Coin
  - **Status Bonus Referral Withdraw**:
    - Saldo Bonus Referral USDT
    - Total USDT WD
    - Sisa Bonus Referral (badge hijau)
  - Tanggal Daftar
  - Aksi (Edit, Hapus, Lihat Referral)

**Actions**:
- **Edit Member**: Update data member
- **Hapus Member**: Delete member
- **Lihat Referral**: Modal untuk melihat referral network (tree structure)

**API**: `/api/admin/members`

---

### 3. Rekap Withdraw (`/dashboard/withdraws`)

**File**: `pages/dashboard/withdraws.vue`

**Fitur**:

#### A. Rekap Withdraw Section
Menampilkan ringkasan total withdraw dalam 3 kategori:

1. **Balance USDT**
   - Total Coin dari Deposit
   - Convert ke USDT

2. **Bonus Aktif**
   - Total Bonus Referral 80% (USDT + Coin)
   - Total Bonus Referral 20% Coin (Convert ke USDT)
   - Total Bonus Matching Coin (Convert ke USDT)
   - Total Bonus Loyalty Coin (Convert ke USDT)
   - Total Coin Bonus Aktif
   - Total USDT (Convert)

3. **Bonus Pasif**
   - Total Reward Staking (Coin + Convert USDT)
   - Total Reward Staking Multiplier (Coin + Convert USDT)
   - Total Coin Bonus Pasif
   - Total USDT (Convert)

**Layout**: Compact grid (3 kolom responsive) dengan spacing yang efisien.

#### B. Create Withdraw Form
Form untuk membuat withdraw baru dengan 2 pilihan:

1. **Balance USDT** (`withdraw_type: 'balance'`)
   - **Info yang ditampilkan**:
     - Sisa Bonus Referral Ready WD (auto-fill amount)
     - Saldo Bonus Referral USDT
     - Total USDT WD
     - Total Bonus Referral 80%
     - Total Bonus Matching 80%
   - **Fields**:
     - Member (select)
     - Amount (USDT) - auto-filled dengan sisa bonus referral
     - Wallet Network (BEP20/ERC20)
     - Admin Wallet Address (random dari database)
     - Member Wallet Address
     - Notes
   - **Category**: `withdraw_category: 'bonus_referral'`

2. **Coin** (`withdraw_type: 'coin'`)
   - **Info yang ditampilkan**:
     - Coin Ready WD (badge hijau)
     - WD Coin
     - Sisa Coin (auto-fill amount_coin)
     - Convert USDT
   - **Fields**:
     - Member (select)
     - Amount Coin - auto-filled dengan sisa coin
     - Wallet Network (BEP20/ERC20)
     - Admin Wallet Address (random dari database)
     - Member Wallet Address
     - Notes
   - **Category**: `withdraw_category: 'coin'`
   - **Auto-calculate**: `amount` (USDT) = `amount_coin` × `coin_price` (sesuai member_type)

#### C. Withdraws List
Tabel daftar withdraw dengan kolom:
- Tanggal
- Member
- Tipe (Balance USDT / Coin)
- **Kategori** (badge):
  - Cyan: `bonus_referral`
  - Amber: `coin`
- Amount (USDT)
- Amount Coin (jika coin withdraw)
- Network
- Status (badge)
- Aksi (Edit, Hapus)

**API**:
- GET `/api/admin/withdraws` - Get all withdraws
- POST `/api/admin/withdraws` - Create withdraw
- GET `/api/admin/withdraw-recap` - Get withdraw recap

---

### 4. Manajemen Wallet (`/dashboard/wallet`)

**File**: `pages/dashboard/wallet.vue`

**Fitur**:
- **Unified Table** untuk BEP20 dan ERC20 wallets
- **Table Header** dengan summary badges (jumlah BEP20, jumlah ERC20)
- **Table Columns**:
  - Network (badge)
  - Wallet Address (dengan copy button on hover)
  - Status (active/inactive dengan colored dot)
  - Aksi (Edit, Hapus)
- **Add/Edit Modal**: Form untuk menambah/edit wallet
- **Delete Confirmation**: Modal konfirmasi dengan icon

**API**:
- GET `/api/admin/wallet` - Get all wallets
- POST `/api/admin/wallet` - Create wallet
- PUT `/api/admin/wallet/[id]` - Update wallet
- DELETE `/api/admin/wallet/[id]` - Delete wallet

---

### 5. Rekap Deposit (`/dashboard/deposits`)

**File**: `pages/dashboard/deposits.vue`

**Fitur**:
- Tabel daftar deposit
- Filter dan search
- Status deposit (pending, completed, rejected)
- Aksi approve/reject

**API**: `/api/admin/deposits`

---

### 6. Bonus Aktif Report (`/dashboard/bonus-active-report`)

**File**: `pages/dashboard/bonus-active-report.vue`

**Fitur**:
- Laporan detail bonus aktif per member
- Breakdown: Referral, Matching Level 1-3, Loyalty
- Summary cards: Total Bonus Aktif, Total Member

**API**: `/api/admin/bonus-active-report`

---

### 7. Bonus Pasif Management (`/dashboard/bonus-pasif`)

**Submenu**:
- **Member List** (`/dashboard/bonus-pasif/members`)
- **Staking** (`/dashboard/bonus-pasif/staking`)
- **Bonus Multiplier** (`/dashboard/bonus-pasif/bonus-multiplier`)
- **Staking Multiplier** (`/dashboard/bonus-pasif/staking-multiplier`)

**Fitur**:
- Manajemen staking dan multiplier staking
- Process rewards (staking & multiplier)
- Reward schedules
- Reward history

---

### 8. Pengaturan (`/dashboard/settings`)

**File**: `pages/dashboard/settings.vue`

**Fitur**:
- Pengaturan umum sistem

---

### 9. Pengaturan Coin (`/dashboard/coin`)

**File**: `pages/dashboard/coin.vue`

**Fitur**:
- Harga coin per member type (Normal, VIP, Leader)
- Coin code
- Logo & favicon

**API**:
- GET `/api/admin/coin`
- PUT `/api/admin/coin`

---

### 10. Pengaturan Bonus (`/dashboard/bonus`)

**File**: `pages/dashboard/bonus.vue`

**Fitur**:
- Persentase bonus referral
- Persentase matching level 1-3
- Persentase loyalty level 1-2
- Split ratio (80% USDT, 20% Coin)

**API**:
- GET `/api/admin/bonus`
- PUT `/api/admin/bonus`

---

## Fitur Utama

### 1. Manajemen Member

- **CRUD Member**: Create, Read, Update, Delete
- **Detail Member**: Lihat semua informasi member termasuk bonus, coin, staking
- **Referral Network**: Tree view untuk melihat downline structure
- **Status Coin**: Real-time calculation untuk coin ready withdraw
- **Status Bonus**: Real-time calculation untuk bonus referral ready withdraw

### 2. Manajemen Withdraw

- **Dua Tipe Withdraw**:
  1. **Balance USDT**: Dari bonus pasif referral 80% + matching 80%
  2. **Coin**: Dari coin ready withdraw
- **Auto-fill Amount**: Otomatis mengisi jumlah maksimal yang bisa di-withdraw
- **Kategori Withdraw**: `bonus_referral` atau `coin`
- **Rekap Withdraw**: Breakdown lengkap per kategori

### 3. Manajemen Coin

- **Harga Coin Dinamis**: Berbeda per member type
- **Coin Staking**: Tracking staking dan multiplier staking
- **Coin Ready WD**: Calculation real-time
- **Synchronization**: Auto-sync `available_coins` via database trigger

### 4. Manajemen Bonus

- **Bonus Aktif**: Referral, Matching, Loyalty
- **Bonus Pasif**: Staking rewards, Multiplier rewards
- **Split Ratio**: 80% USDT, 20% Coin untuk bonus referral
- **Real-time Calculation**: Semua bonus dihitung real-time dari database

### 5. Dashboard Statistics

- **Total Member**: Jumlah member terdaftar
- **Total Deposit**: Total USDT dari deposit completed
- **Total Withdraw**: Total USDT dari withdraw (completed + pending)

---

## API Endpoints

### Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/members` | Get all members dengan detail lengkap |
| POST | `/api/admin/members` | Create new member |
| PUT | `/api/admin/members/[id]` | Update member |
| DELETE | `/api/admin/members/[id]` | Delete member |
| GET | `/api/admin/members/[id]/referrals` | Get referral network |
| GET | `/api/admin/members/[id]/bonus-details` | Get bonus details |

### Withdraws

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/withdraws` | Get all withdraws |
| POST | `/api/admin/withdraws` | Create withdraw |
| PUT | `/api/admin/withdraws/[id]` | Update withdraw |
| DELETE | `/api/admin/withdraws/[id]` | Delete withdraw |
| GET | `/api/admin/withdraw-recap` | Get withdraw recap (aggregated) |
| GET | `/api/admin/withdraw-stats` | Get statistics (member, deposit, withdraw) |

### Bonus

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/bonus` | Get bonus settings |
| PUT | `/api/admin/bonus` | Update bonus settings |
| GET | `/api/admin/bonus-active-report` | Get bonus aktif report |
| POST | `/api/admin/calculate-loyalty-bonus` | Calculate loyalty bonus |

### Coin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/coin` | Get coin settings |
| PUT | `/api/admin/coin` | Update coin settings |
| GET | `/api/admin/member-coins/[memberId]` | Get member coins |

### Staking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/staking` | Get all staking |
| POST | `/api/admin/staking` | Create staking |
| PUT | `/api/admin/staking/[id]/unstake` | Unstake |
| DELETE | `/api/admin/staking/[id]` | Delete staking |
| POST | `/api/admin/process-pending-rewards` | Process staking rewards |
| POST | `/api/admin/process-pending-multiplier-rewards` | Process multiplier rewards |

### Wallet

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/wallet` | Get all wallet addresses |
| POST | `/api/admin/wallet` | Create wallet |
| PUT | `/api/admin/wallet/[id]` | Update wallet |
| DELETE | `/api/admin/wallet/[id]` | Delete wallet |
| GET | `/api/admin/wallet-addresses` | Get wallet addresses (for withdraw form) |

### Deposits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/deposits` | Get all deposits |
| POST | `/api/admin/deposits` | Create deposit |
| PUT | `/api/admin/deposits/[id]` | Update deposit |
| DELETE | `/api/admin/deposits/[id]` | Delete deposit |

---

## Database Schema

### Tabel Utama

#### `members`
- `id`, `email`, `name`, `referral_code`, `referrer_id`, `member_type`, `status`, dll.

#### `withdraws`
- `id`, `member_id`, `amount` (USDT), `amount_coin` (Coin), `withdraw_type`, `withdraw_category`, `status`, `wallet_network`, `admin_wallet_address`, `member_wallet_address`, `created_at`, dll.

**Kolom Baru**:
- `amount_coin` (DECIMAL(18,8)): Jumlah coin yang di-withdraw
- `withdraw_category` (VARCHAR(50)): `'bonus_referral'` atau `'coin'`

#### `member_coins`
- `id`, `member_id`, `total_coins`, `staked_coins`, `available_coins`
- **Trigger**: `sync_member_coins_available` - Auto-update `available_coins = total_coins - staked_coins`

#### `staking`
- `id`, `member_id`, `coin_amount`, `duration_days`, `status`, `staked_at`, `unstaked_at`, dll.

#### `bonus_multiplier_staking`
- `id`, `member_id`, `coin_amount`, `multiplier`, `status`, dll.

#### `reward_history`
- `id`, `member_id`, `bonus_type`, `amount`, `amount_coin`, `created_at`, dll.

#### `deposits`
- `id`, `member_id`, `amount`, `status`, `created_at`, dll.

#### `wallets`
- `id`, `network` (BEP20/ERC20), `address`, `status`, dll.

#### `coin_settings`
- `id`, `coin_code`, `normal_price_usdt`, `vip_price_usdt`, `leader_price_usdt`, `logo_url`, `favicon_url`, dll.

#### `bonus_settings`
- `id`, `referral_percentage`, `matching_level1_percentage`, `matching_level2_percentage`, `matching_level3_percentage`, `loyalty_level1_percentage`, `loyalty_level2_percentage`, `referral_split_usdt`, `referral_split_coin`, dll.

---

## Perhitungan Penting

### 1. Balance USDT (Bonus Referral) Withdraw

#### Saldo Bonus Referral USDT
```
Saldo = Referral Bonus USDT (80%) + Matching Bonus USDT (80%)
```

#### Total USDT WD
```sql
SELECT SUM(amount) 
FROM withdraws 
WHERE member_id = ? 
  AND withdraw_category = 'bonus_referral' 
  AND status IN ('completed', 'pending')
```

#### Sisa Bonus Referral Ready WD
```
Sisa = Saldo Bonus Referral USDT - Total USDT WD
```

**Auto-fill Amount**: Sisa Bonus Referral Ready WD

---

### 2. Coin Withdraw

#### Total Coin Member
```
Total Coin = Coin Deposit + Total Coin Pasif + Total Coin Aktif
```

#### Coin Ready WD
```
Coin Ready WD = Total Coin Member - (Staking + Staking Multiplier)
```

#### WD Coin
```sql
SELECT SUM(amount_coin) 
FROM withdraws 
WHERE member_id = ? 
  AND status IN ('completed', 'pending')
```

#### Sisa Coin
```
Sisa Coin = Coin Ready WD - WD Coin
```

**Auto-fill Amount Coin**: Sisa Coin

**Convert USDT**:
```
Convert USDT = Sisa Coin × Harga Coin (sesuai member_type)
```

---

### 3. Harga Coin per Member Type

- **Normal**: `coin_settings.normal_price_usdt`
- **VIP**: `coin_settings.vip_price_usdt`
- **Leader**: `coin_settings.leader_price_usdt`

---

### 4. Bonus Calculation

#### Bonus Referral (80% USDT, 20% Coin)
```
Referral Bonus USDT = Downline Deposit × Referral Percentage × 80%
Referral Bonus Coin = Downline Deposit × Referral Percentage × 20% / Coin Price
```

#### Matching Bonus (80% USDT, 20% Coin)
```
Matching Level 1 = Level 2 Total Deposit × Matching L1 Percentage × 80%
Matching Level 2 = Level 3 Total Deposit × Matching L2 Percentage × 80%
Matching Level 3 = Level 4 Total Deposit × Matching L3 Percentage × 80%
```

#### Loyalty Bonus (100% Coin)
```
Loyalty Level 1 = Total Deposit × Loyalty L1 Percentage / Coin Price
Loyalty Level 2 = Total Deposit × Loyalty L2 Percentage / Coin Price
```

---

### 5. Coin Staking Calculation

#### Total Coin Member
```
Total Coin = Coin Deposit + Total Coin Pasif + Total Coin Aktif
```

#### Available Coins
```
Available Coins = Total Coins - Staked Coins
```

**Trigger**: `sync_member_coins_available` - Auto-update saat `total_coins` atau `staked_coins` berubah.

#### Update Total Coins saat Reward Paid
Saat reward staking atau multiplier dibayar, `member_coins.total_coins` di-update:
```typescript
newTotalCoins = currentTotalCoins + rewardAmount
```

Trigger akan otomatis update `available_coins`.

---

## Migration Files

### Withdraw Related

1. **`withdraws_add_amount_coin.sql`**
   - Menambahkan kolom `amount_coin` (DECIMAL(18,8))
   - Index untuk query optimization

2. **`withdraws_add_withdraw_category.sql`**
   - Menambahkan kolom `withdraw_category` (VARCHAR(50))
   - Update existing records: `'balance'` → `'bonus_referral'`
   - Index untuk query optimization

### Coin Related

3. **`member_coins_table.sql`**
   - Tabel `member_coins` dengan trigger `sync_member_coins_available`

4. **`coin_settings_table.sql`**
   - Tabel `coin_settings` dengan harga per member type

### Bonus Related

5. **`bonus_settings_table.sql`**
   - Tabel `bonus_settings` dengan semua persentase bonus

6. **`reward_history_table.sql`**
   - Tabel `reward_history` untuk tracking semua reward

### Staking Related

7. **`staking_table.sql`**
   - Tabel `staking` untuk regular staking

8. **`add_coin_amount_to_bonus_multiplier_staking.sql`**
   - Menambahkan `coin_amount` ke `bonus_multiplier_staking`

---

## Cara Penggunaan

### 1. Login Admin

1. Buka `http://localhost:3001`
2. Login dengan kredensial admin
3. Redirect ke `/dashboard`

### 2. Melihat Dashboard Statistics

1. Buka `/dashboard`
2. Lihat 3 cards: Total Member, Total Deposit, Total Withdraw

### 3. Membuat Withdraw

#### Balance USDT:
1. Buka `/dashboard/withdraws`
2. Klik "Buat Withdraw"
3. Pilih "Balance USDT"
4. Pilih member (auto-fill amount dengan sisa bonus referral)
5. Isi wallet network, admin wallet (random), member wallet
6. Submit

#### Coin:
1. Pilih "Coin"
2. Pilih member (auto-fill amount_coin dengan sisa coin)
3. Amount USDT otomatis terhitung dari `amount_coin × coin_price`
4. Isi wallet network, admin wallet (random), member wallet
5. Submit

### 4. Melihat Member Details

1. Buka `/dashboard/members`
2. Klik "Lihat Referral" untuk melihat referral network
3. Lihat semua status: Coin Staking, Coin Withdraw, Bonus Referral Withdraw

### 5. Manajemen Wallet

1. Buka `/dashboard/wallet`
2. Lihat semua wallet (BEP20 & ERC20 dalam 1 tabel)
3. Klik "Tambah Wallet" untuk menambah wallet baru
4. Hover pada address untuk copy button

### 6. Melihat Rekap Withdraw

1. Buka `/dashboard/withdraws`
2. Scroll ke "Rekap Withdraw"
3. Lihat breakdown: Balance USDT, Bonus Aktif, Bonus Pasif

---

## Development Guide

### Setup

```bash
# Install dependencies
cd admin-package
npm install

# Setup environment variables
# Copy .env.example to .env
# Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

# Run development server
npm run dev
# Server akan berjalan di http://localhost:3001
```

### Build Production

```bash
npm run build
npm run start
```

### Database Migrations

1. Jalankan migration files di folder `database/` secara berurutan
2. Pastikan semua trigger dan function sudah dibuat
3. Test dengan data sample

### API Testing

Gunakan Postman atau curl untuk test API endpoints:

```bash
# Get members
curl http://localhost:3001/api/admin/members

# Get withdraw stats
curl http://localhost:3001/api/admin/withdraw-stats

# Create withdraw
curl -X POST http://localhost:3001/api/admin/withdraws \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": "xxx",
    "withdraw_type": "balance",
    "amount": "100.00",
    "wallet_network": "BEP20",
    "member_wallet_address": "0x..."
  }'
```

### Code Structure

- **Pages**: Vue components untuk halaman
- **Components**: Reusable Vue components
- **Server API**: Nuxt server API routes (TypeScript)
- **Database**: SQL migration files
- **Types**: TypeScript type definitions

### Best Practices

1. **Error Handling**: Selalu handle error di API endpoints
2. **Validation**: Validate input sebelum insert/update
3. **Type Safety**: Gunakan TypeScript types untuk database
4. **Responsive Design**: Pastikan semua halaman responsive
5. **Loading States**: Tampilkan loading state saat fetch data
6. **Error Messages**: Tampilkan error message yang user-friendly

---

## Catatan Penting

### 1. Withdraw Category

- `'bonus_referral'`: Untuk withdraw Balance USDT (dari bonus pasif referral 80% + matching 80%)
- `'coin'`: Untuk withdraw Coin

### 2. Status Withdraw

Hanya `'completed'` dan `'pending'` yang dihitung untuk:
- Total USDT WD
- Total WD Coin
- Sisa Bonus Referral
- Sisa Coin

Status `'rejected'` **tidak** dihitung.

### 3. Coin Price

Harga coin berbeda per `member_type`:
- Normal: `normal_price_usdt`
- VIP: `vip_price_usdt`
- Leader: `leader_price_usdt`

### 4. Auto-sync Available Coins

Database trigger `sync_member_coins_available` otomatis update `available_coins` saat:
- `total_coins` berubah
- `staked_coins` berubah

### 5. Reward Processing

Saat reward dibayar:
1. Insert ke `reward_history`
2. Update `member_coins.total_coins` (+ reward amount)
3. Trigger update `available_coins`

---

## Dokumentasi Terkait

- **`WITHDRAW_CALCULATION.md`**: Detail perhitungan withdraw
- **`TOTAL_COIN_STAKING_CALCULATION.md`**: Detail perhitungan coin staking
- **`BONUS_PASIF_SETUP.md`**: Setup bonus pasif
- **`PERHITUNGAN_BONUS.md`**: Perhitungan bonus aktif

---

## Support & Maintenance

### Logs

Check server logs untuk debugging:
- API errors
- Database errors
- Validation errors

### Common Issues

1. **Withdraw amount tidak sesuai**: Check `withdraw_category` dan `status`
2. **Coin ready WD negatif**: Check `total_coins` dan `staked_coins`
3. **Bonus referral tidak muncul**: Check `referral_bonus_usdt` dan `matching_bonus_usdt`

### Updates

Untuk update fitur baru:
1. Buat migration file jika perlu
2. Update API endpoint
3. Update frontend component
4. Test thoroughly
5. Update dokumentasi

---

## Versi

**Version**: 1.0.0 (Final)  
**Last Updated**: January 2026  
**Status**: ✅ 100% Complete & Tested

---

**Dokumentasi ini mencakup semua fitur dan fungsi admin dashboard yang sudah 100% fix dan siap digunakan.**
