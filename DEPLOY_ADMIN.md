# Deploy Admin Package to Vercel

Follow these steps to deploy the Admin Package to Vercel.

## 1. Push Code to GitHub
The code is being pushed to:
- `https://github.com/majuselima-cmyk/crudv2_backup_admin.git` | branch: `main`

## 2. Import Project in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Select the `crudv2_backup_admin` repository.
4. Click **"Import"**.

## 3. Configure Project
Vercel should automatically detect **Nuxt.js**. Verify the following:
- **Framework Preset**: `Nuxt.js`
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.output`

## 4. Environment Variables
You must add your Supabase keys here.

Expand **"Environment Variables"** section and add:

| Key | Value |
|-----|-------|
| `NUXT_PUBLIC_SUPABASE_URL` | *Your Supabase Project URL* |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | *Your Supabase Anon Key* |
| `SUPABASE_SERVICE_ROLE_KEY` | *Your Supabase Service Role Key* |

*Note: You can use the same keys as the main app, or different ones if you are using a different Supabase project.*

## 5. Deploy
Click **"Deploy"**.
