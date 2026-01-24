# Bonus Multiplier - Dokumentasi

## Deskripsi
Halaman admin untuk mengelola Staking dan Bonus Multiplier. Fitur ini memungkinkan admin untuk membuat staking baru, mengelola multiplier staking, dan melihat jadwal reward.

## Lokasi File
`pages/dashboard/bonus-pasif/bonus-multiplier.vue`

## Fitur Utama

### 1. Staking Management
- **Daftar Staking**: Menampilkan semua staking dengan pagination
- **Create Staking**: Membuat staking baru untuk member
- **Unstake**: Mengembalikan koin staking ke member
- **Reset Reward**: Mereset total reward yang sudah dihitung
- **Delete Staking**: Menghapus staking beserta reward schedule terkait
- **View Schedule**: Melihat jadwal reward untuk setiap staking

### 2. Multiplier Staking
- **Daftar Multiplier Staking**: Menampilkan semua multiplier staking
- **Create Multiplier Staking**: Membuat staking multiplier dari total reward yang sudah diterima
- **View Multiplier Schedule**: Melihat jadwal reward multiplier dengan multiplier value

### 3. Auto-Processing
- **Auto-update Schedule Status**: Update status dari `pending` ke `paid` setiap 30 detik
- **Auto-process Pending Rewards**: Proses pending rewards setiap 1 menit
- **Auto-refresh Data**: Refresh data staking setiap 10 detik

## Komponen yang Digunakan

### Components
- `Sidebar`: Sidebar navigation
- `MobileHeader`: Header untuk mobile
- `MemberSelect`: Komponen untuk memilih member
- `Icon`: Komponen icon

## State Management

### Reactive Variables

#### UI State
```javascript
isMobileMenuOpen: boolean
loading: boolean
errorMessage: string
successMessage: string
showCreateStakingModal: boolean
showUnstakeModal: boolean
showResetRewardModal: boolean
showDeleteStakingModal: boolean
showStakingMultiplierModal: boolean
```

#### Data Lists
```javascript
stakingList: Array<Staking>
membersList: Array<Member>
multiplierStakingList: Array<MultiplierStaking>
rewardSchedulesList: Array<RewardSchedule>
multiplierSchedulesList: Array<MultiplierSchedule>
```

#### Form Data
```javascript
stakingForm: {
  member_id: string
  coin_amount: string
  reward_percentage: string
  duration_minutes: string
}

multiplierStakingForm: {
  member_id: string
  coin_amount: string
}
```

#### Settings
```javascript
bonusSettings: {
  reward_interval_minutes: number
  is_active: boolean
  coin_code: string
}

multiplierSettings: {
  multiplier_bonus_base_percentage: number
  multiplier_increment_percentage: number
  multiplier_increment_period_minutes: number
}

defaultRewardPercentage: number
defaultStakingDurationMinutes: number
```

#### Pagination
```javascript
currentPageStaking: number
itemsPerPageStaking: number
```

#### Expanded Rows
```javascript
expandedStakingRows: Set<number>
expandedMultiplierRows: Set<number>
```

## API Endpoints

### GET Endpoints
- `GET /api/admin/members` - Get list members
- `GET /api/admin/staking` - Get list staking
- `GET /api/admin/bonus` - Get bonus settings
- `GET /api/admin/coin` - Get coin settings
- `GET /api/admin/reward-schedules` - Get reward schedules
- `GET /api/admin/bonus-multiplier-staking` - Get multiplier staking list
- `GET /api/admin/bonus-multiplier-schedules` - Get multiplier schedules
- `GET /api/admin/member-coins/:memberId` - Get member coin balance

### POST Endpoints
- `POST /api/admin/staking` - Create new staking
- `POST /api/admin/bonus-multiplier-staking` - Create multiplier staking
- `POST /api/admin/bonus-multiplier-schedules` - Create multiplier schedules
- `POST /api/admin/auto-update-schedule-status` - Auto-update schedule status
- `POST /api/admin/process-pending-rewards` - Process pending rewards

### PUT Endpoints
- `PUT /api/admin/staking/:id/unstake` - Unstake staking
- `PUT /api/admin/staking/:id/reset-reward` - Reset reward

### DELETE Endpoints
- `DELETE /api/admin/staking/:id` - Delete staking

## Functions

### Data Fetching

#### `fetchData()`
Mengambil semua data yang diperlukan:
- Members list
- Staking list
- Bonus settings
- Coin settings
- Reward schedules
- Multiplier staking
- Multiplier schedules

#### `fetchMemberCoins(memberId)`
Mengambil data coin balance untuk member tertentu.

#### `fetchRewardSchedules()`
Mengambil semua reward schedules dari database.

#### `fetchMultiplierStaking()`
Mengambil semua multiplier staking dari database.

#### `fetchMultiplierSchedules()`
Mengambil semua multiplier schedules dari database.

### Staking Operations

#### `createStaking()`
Membuat staking baru:
- Validasi form
- Set waktu dalam UTC
- Kirim ke API

#### `handleUnstake()`
Unstake staking:
- Mengembalikan koin ke member
- Update status staking

#### `handleResetReward()`
Reset total reward:
- Reset `total_reward_paid` ke 0
- Hapus reward schedules terkait

#### `handleDeleteStaking()`
Hapus staking:
- Hapus staking dari database
- Hapus reward schedules terkait
- Kembalikan koin ke member (jika aktif)

### Multiplier Staking Operations

#### `openStakingMultiplierModal(staking)`
Buka modal untuk create multiplier staking:
- Auto-fill dari `total_reward_paid`

#### `createMultiplierStaking()`
Membuat multiplier staking:
1. Simpan ke `bonus_multiplier_staking`
2. Generate schedules dengan `generateMultiplierSchedules()`
3. Simpan schedules ke `bonus_multiplier_schedules`

#### `generateMultiplierSchedules(startDate, coinAmount, basePercentage, rewardIntervalMinutes, multiplierIncrementPeriod)`
Generate jadwal reward multiplier:
- Reward diberikan setiap `rewardIntervalMinutes` (default: 3 menit)
- Multiplier naik setiap `multiplierIncrementPeriod` (default: 10 menit)
- Multiplier naik sebesar `basePercentage` (default: 10%)
- Generate untuk 1 tahun (525600 menit)

**Formula Reward:**
```
rewardAmount = coinAmount * currentMultiplier * (basePercentage / 100)
```

**Contoh:**
- Base: 10%
- Reward Interval: 3 menit
- Multiplier Period: 10 menit
- Coin Amount: 1000

**Timeline:**
- 0-10 menit: Multiplier 1.10, Reward = 1000 * 1.10 * 0.10 = 110 (setiap 3 menit)
- 10-20 menit: Multiplier 1.20, Reward = 1000 * 1.20 * 0.10 = 120 (setiap 3 menit)
- 20-30 menit: Multiplier 1.30, Reward = 1000 * 1.30 * 0.10 = 130 (setiap 3 menit)
- dst...

### Utility Functions

#### Date/Time Formatting
- `formatDateTimeUTC(date)`: Format datetime UTC
- `formatDateTimeUTCCompact(date)`: Format datetime UTC compact
- `formatDateTimeWIB(date)`: Format datetime WIB (UTC+7)
- `formatDateTimeWIBCompact(date)`: Format datetime WIB compact
- `calculateEndDate(startDate, durationMinutes)`: Hitung tanggal selesai
- `calculateStakingEndDate(staking)`: Hitung tanggal selesai staking
- `getRemainingTime(staking)`: Hitung sisa waktu staking

#### Formatting
- `formatCoinAmount(amount)`: Format jumlah koin
- `formatCoinAmountWithCode(amount)`: Format jumlah koin dengan kode
- `formatDuration(minutes)`: Format durasi (bulan, hari, jam, menit)
- `formatMemberType(type)`: Format tipe member
- `formatStatus(status)`: Format status staking
- `formatScheduleStatus(status)`: Format status schedule

#### Helper Functions
- `calculateStats()`: Hitung statistik (total active staking, total staked coins, total reward)
- `getRewardSchedulesForStaking(stakingId)`: Get schedules untuk staking tertentu
- `getMultiplierSchedulesForStaking(multiplierStakingId)`: Get schedules untuk multiplier staking tertentu
- `toggleStakingSchedule(stakingId)`: Toggle expand/collapse schedule
- `toggleMultiplierSchedule(multiplierStakingId)`: Toggle expand/collapse multiplier schedule

### Pagination

#### `nextPageStaking()`
Pindah ke halaman berikutnya.

#### `previousPageStaking()`
Pindah ke halaman sebelumnya.

#### `visiblePages` (computed)
Generate visible page numbers dengan ellipsis.

## Computed Properties

### `isStakingFormValid`
Validasi form staking:
- Member ID harus dipilih
- Coin amount harus > 0
- Coin amount tidak boleh melebihi total coins member
- Duration minimal 1 bulan (43200 menit)

### `totalPagesStaking`
Total halaman untuk pagination staking.

### `paginationStartStaking`
Index mulai untuk pagination.

### `paginationEndStaking`
Index akhir untuk pagination.

### `paginatedStakingList`
List staking yang ditampilkan di halaman saat ini.

## Lifecycle Hooks

### `onMounted()`
1. Fetch data awal
2. Auto-update schedule status setelah 1 detik
3. Setup interval untuk auto-refresh (10 detik)
4. Setup interval untuk auto-update status (30 detik)
5. Setup interval untuk auto-process pending rewards (1 menit)

### `onBeforeUnmount()`
Cleanup semua interval:
- `stakingRefreshInterval`
- `autoUpdateStatusInterval`
- `autoProcessPendingInterval`

## Auto-Processing Intervals

### 1. Auto-Refresh (10 detik)
- Refresh staking list
- Refresh reward schedules
- Recalculate stats

### 2. Auto-Update Status (30 detik)
- Update schedule status dari `pending` ke `paid` jika waktu sudah lewat
- Refresh reward schedules dan staking list setelah update

### 3. Auto-Process Pending Rewards (1 menit)
- Process pending rewards
- Refresh staking list dan reward schedules setelah process

## Timezone Handling

### UTC Storage
- Semua waktu disimpan dalam UTC di database
- Waktu ditampilkan dalam format UTC dan WIB (UTC+7)

### Format Display
- **UTC**: `23 Jan 2026, 03:45:42 UTC`
- **WIB**: `24 Jan 2026, 10:45:42 WIB` (UTC+7)

## Modal Components

### 1. Create Staking Modal
- Form untuk membuat staking baru
- Preview tanggal mulai dan selesai
- Validasi form

### 2. Unstake Modal
- Konfirmasi unstake
- Tampilkan informasi staking

### 3. Reset Reward Modal
- Konfirmasi reset reward
- Warning tentang penghapusan schedules

### 4. Delete Staking Modal
- Konfirmasi delete staking
- Warning tentang penghapusan data

### 5. Staking Multiplier Modal
- Form untuk membuat multiplier staking
- Auto-fill dari total reward
- Preview konfigurasi multiplier

## Stats Cards

### 1. Total Staking Aktif
- Jumlah staking dengan status `active`
- Menampilkan "Mendapat reward"

### 2. Total Koin Staking
- Total koin yang di-stake (hanya yang aktif)
- Format dengan kode koin

### 3. Total Reward Earned
- Total reward dari reward schedules dengan status `paid`
- Format dengan kode koin

## Table Columns

### Staking Table
1. Member (username, email, member type)
2. Koin (dengan kode)
3. Reward %
4. Durasi
5. Total Reward
6. Status
7. Tanggal Mulai (UTC & WIB)
8. Tanggal Selesai (UTC & WIB)
9. Aksi (Staking Multiplier, Jadwal)

### Multiplier Staking Table
1. Member (username, email)
2. Koin (dengan kode)
3. Base %
4. Reward Interval
5. Multiplier Period
6. Tanggal Mulai (UTC & WIB)
7. Aksi (Jadwal)

## Expanded Rows

### Staking Schedule
- Menampilkan semua reward schedules untuk staking tertentu
- Status: Pending (orange) / Paid (green)
- Waktu: UTC & WIB
- Reward amount

### Multiplier Schedule
- Menampilkan semua multiplier schedules untuk multiplier staking tertentu
- Status: Pending (orange) / Paid (green)
- Multiplier value
- Waktu: UTC & WIB
- Reward amount

## Error Handling

### Error Messages
- Error ditampilkan dalam red alert box
- Auto-hide setelah 5 detik
- Button "Coba lagi" untuk retry

### Success Messages
- Success ditampilkan dalam green toast (bottom-right)
- Auto-hide setelah 5 detik

## Validation

### Staking Form
- Member ID: Required
- Coin Amount: Required, > 0, <= total coins
- Reward Percentage: Optional (default dari settings)
- Duration: Required, minimal 1 bulan (43200 menit)

### Multiplier Staking Form
- Member ID: Required
- Coin Amount: Required, > 0

## Notes

### Timezone
- Semua waktu disimpan dalam UTC
- Display dalam UTC dan WIB untuk kemudahan membaca
- Saat create staking, waktu otomatis disimpan dalam UTC

### Reward Calculation
- Reward dihitung berdasarkan `coin_amount * reward_percentage / 100`
- Reward diberikan setiap interval (dari bonus settings)
- Hanya staking dengan status `active` yang mendapat reward

### Multiplier Calculation
- Base multiplier: `1 + (basePercentage / 100)`
- Multiplier naik setiap `multiplierIncrementPeriod` menit
- Kenaikan: `basePercentage / 100`
- Reward: `coinAmount * currentMultiplier * (basePercentage / 100)`

### Schedule Status
- `pending`: Belum waktunya atau belum diproses
- `paid`: Sudah diproses dan dibayar

### Staking Status
- `active`: Staking aktif, mendapat reward
- `unstaked`: Sudah di-unstake, tidak mendapat reward
- `cancelled`: Dibatalkan

## Dependencies

### Nuxt 3
- `definePageMeta`: Set layout
- `$fetch`: API calls
- `ref`, `computed`, `onMounted`, `onBeforeUnmount`: Vue Composition API

### Components
- `Sidebar`
- `MobileHeader`
- `MemberSelect`
- `Icon`

## Future Improvements

1. **Filter & Search**
   - Filter by status
   - Search by member username/email
   - Filter by date range

2. **Export Data**
   - Export staking list to CSV/Excel
   - Export schedules to CSV/Excel

3. **Bulk Operations**
   - Bulk unstake
   - Bulk delete

4. **Advanced Statistics**
   - Chart untuk reward over time
   - Member performance statistics

5. **Notifications**
   - Notifikasi saat reward paid
   - Notifikasi saat staking selesai

