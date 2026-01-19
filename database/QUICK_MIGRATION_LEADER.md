# Quick Migration: Add Leader Price Column

## Error yang Terjadi
```
Could not find the 'leader_price_usdt' column of 'coin_settings' in the schema cache
```

## Solusi: Jalankan Migration SQL

### Langkah 1: Buka Supabase Dashboard
1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Buka menu **SQL Editor** (di sidebar kiri)

### Langkah 2: Jalankan Migration SQL

Copy dan paste SQL berikut ke SQL Editor:

```sql
-- Migration: Add Leader Price to Coin Settings
-- Tambahkan kolom leader_price_usdt ke tabel coin_settings

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'coin_settings' 
        AND column_name = 'leader_price_usdt'
    ) THEN
        ALTER TABLE public.coin_settings 
        ADD COLUMN leader_price_usdt DECIMAL(10,4) NOT NULL DEFAULT 0.5000;
        
        RAISE NOTICE 'Kolom leader_price_usdt berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom leader_price_usdt sudah ada, melewati...';
    END IF;
END $$;

-- Update existing records dengan default value
UPDATE public.coin_settings 
SET leader_price_usdt = 0.5000 
WHERE leader_price_usdt IS NULL;
```

### Langkah 3: Klik "Run" atau Tekan Ctrl+Enter

### Langkah 4: Verifikasi

Jalankan query ini untuk memastikan kolom sudah ada:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'coin_settings'
AND column_name = 'leader_price_usdt';
```

Jika berhasil, akan muncul:
- `column_name`: leader_price_usdt
- `data_type`: numeric
- `column_default`: 0.5000

### Langkah 5: Refresh Aplikasi

Setelah migration berhasil:
1. Restart development server (jika perlu)
2. Refresh halaman `/dashboard/coin`
3. Kolom Leader Member Price seharusnya sudah muncul

## Alternatif: Migration Manual (Jika Error)

Jika migration di atas error, coba cara manual:

```sql
-- Hapus constraint NOT NULL dulu (jika ada)
ALTER TABLE public.coin_settings 
ALTER COLUMN leader_price_usdt DROP NOT NULL;

-- Tambahkan kolom (tanpa NOT NULL dulu)
ALTER TABLE public.coin_settings 
ADD COLUMN IF NOT EXISTS leader_price_usdt DECIMAL(10,4);

-- Update semua record dengan default value
UPDATE public.coin_settings 
SET leader_price_usdt = 0.5000 
WHERE leader_price_usdt IS NULL;

-- Set default value
ALTER TABLE public.coin_settings 
ALTER COLUMN leader_price_usdt SET DEFAULT 0.5000;

-- Set NOT NULL
ALTER TABLE public.coin_settings 
ALTER COLUMN leader_price_usdt SET NOT NULL;
```

## Troubleshooting

### Error: "column already exists"
- Kolom sudah ada, tidak perlu dijalankan lagi
- Langsung ke Langkah 4 untuk verifikasi

### Error: "relation does not exist"
- Tabel `coin_settings` belum dibuat
- Jalankan dulu `coin_settings_table.sql`

### Error: "permission denied"
- Pastikan menggunakan Service Role Key atau admin access
- Atau disable RLS sementara untuk migration

## File Migration
- Location: `database/coin_settings_add_leader_migration.sql`
- Default value: 0.5000 USDT

