# Environment Variables Setup

## Langkah Setup

1. **Buat file `.env` di folder `admin-package/`** (bersebelahan dengan `package.json`)

2. **Copy isi berikut ke file `.env`:**

```env
# Supabase Configuration
SUPABASE_URL=https://iwbhocoepxpvjmdqmvxt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmhvY29lcHhwdmptZHFtdnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDg4MzYsImV4cCI6MjA4NDI4NDgzNn0.qMURPaNZ4VZcgzlIlP_UO18im98qdzvRkf4mVP1ABqs

# Public variables (accessible in client)
NUXT_PUBLIC_SUPABASE_URL=https://iwbhocoepxpvjmdqmvxt.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmhvY29lcHhwdmptZHFtdnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDg4MzYsImV4cCI6MjA4NDI4NDgzNn0.qMURPaNZ4VZcgzlIlP_UO18im98qdzvRkf4mVP1ABqs

# Service Role Key (server-side only, never expose to client!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmhvY29lcHhwdmptZHFtdnh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODcwODgzNiwiZXhwIjoyMDg0Mjg0ODM2fQ.NxLXVhMV8Sv_LkLNL5naJafHnZkqy6aTJ6I4qiS_GzE
```

3. **Restart dev server:**
   - Hentikan server (Ctrl+C)
   - Jalankan lagi: `npm run dev`

## Cek File Lokasi

Pastikan file `.env` berada di:
```
D:\crud\admin-package\.env
```

BUKAN di:
```
D:\crud\.env  ❌ (salah)
```

## Verifikasi

Setelah restart server, coba login. Jika masih error, cek console log di terminal untuk melihat debug info tentang environment variables.


