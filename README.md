# Store – Coupons & Stores (Next.js + Supabase)

Next.js app with an admin panel. Stores and coupons are stored in **Supabase**.

- **Supabase URL:** `https://xpazoabxehvsldzgvbrr.supabase.co`

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Supabase tables

In your [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**, run the migration:

- Open `supabase/migrations/001_stores_and_coupons.sql`
- Copy its contents and run in the SQL Editor (for project `xpazoabxehvsldzgvbrr`)

This creates `public.stores` and `public.coupons` tables.

### 3. Environment variables

Copy the example env file and set your keys:

```bash
cp .env.example .env.local
```

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=https://xpazoabxehvsldzgvbrr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ADMIN_PASSWORD=your_admin_password_here
```

- **SUPABASE_SERVICE_ROLE_KEY** – From Supabase Dashboard → Project Settings → API → `service_role` (secret)
- **ADMIN_PASSWORD** – Password for the admin panel

In development, if `ADMIN_PASSWORD` is not set, the default is `admin123`.

### 4. Run locally

```bash
npm run dev
```

- **Home:** [http://localhost:3000](http://localhost:3000)
- **Admin:** [http://localhost:3000/admin](http://localhost:3000/admin) (redirects to login)

## Features

- **Public:** Home page lists stores and latest coupons; each store has a page at `/stores/[slug]`.
- **Admin:** Password-protected dashboard at `/admin` to create, edit, and delete stores and coupons. Data is read/written via Supabase.

## Deploy (e.g. Vercel)

1. Set the same environment variables in your host (Vercel → Project → Settings → Environment Variables).
2. Deploy; the app uses Supabase only (no file storage), so it works on serverless.
