-- Run in Supabase SQL Editor (Dashboard → SQL Editor) for project:
-- https://xpazoabxehvsldzgvbrr.supabase.co
-- Then set in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

create table if not exists public.stores (
  id text primary key,
  data jsonb not null
);

create table if not exists public.coupons (
  id text primary key,
  data jsonb not null
);

-- Optional: allow anon/authenticated read if you use RLS
-- alter table public.stores enable row level security;
-- alter table public.coupons enable row level security;
-- create policy "Allow public read" on public.stores for select using (true);
-- create policy "Allow public read" on public.coupons for select using (true);
