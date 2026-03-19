-- ==============================================
-- ÖNSKA – Supabase schema
-- Klistra in detta i Supabase SQL Editor och kör
-- ==============================================

-- Profiles (kopplas till auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  partner_id uuid references public.profiles(id),
  pairing_code text not null unique,
  status text default null,
  created_at timestamptz default now()
);

-- Tjänster
create table public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  mode text check (mode in ('fint', 'snusk')) not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- Kalender-tillgänglighet
create table public.availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  available boolean default true,
  unique(user_id, date)
);

-- Beställningar
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references public.profiles(id) not null,
  to_user_id uuid references public.profiles(id) not null,
  service_id uuid references public.services(id) not null,
  date date,
  status text check (status in ('pending', 'accepted', 'declined', 'completed')) default 'pending',
  note text,
  mode text check (mode in ('fint', 'snusk')) not null,
  created_at timestamptz default now()
);

-- ── Row Level Security ──

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.availability enable row level security;
alter table public.orders enable row level security;

-- Profiles: alla inloggade kan läsa, bara du kan ändra ditt
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Services: alla inloggade kan läsa, bara ägaren kan ändra
create policy "services_select" on public.services for select to authenticated using (true);
create policy "services_insert" on public.services for insert with check (auth.uid() = user_id);
create policy "services_update" on public.services for update using (auth.uid() = user_id);
create policy "services_delete" on public.services for delete using (auth.uid() = user_id);

-- Availability: alla inloggade kan läsa, bara ägaren kan ändra
create policy "availability_select" on public.availability for select to authenticated using (true);
create policy "availability_insert" on public.availability for insert with check (auth.uid() = user_id);
create policy "availability_update" on public.availability for update using (auth.uid() = user_id);
create policy "availability_delete" on public.availability for delete using (auth.uid() = user_id);

-- Orders: bara inblandade parter kan se/ändra
create policy "orders_select" on public.orders for select using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);
create policy "orders_insert" on public.orders for insert with check (auth.uid() = from_user_id);
create policy "orders_update" on public.orders for update using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);
create policy "orders_delete" on public.orders for delete using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);

-- ── Realtime ── (aktivera för orders-tabellen)
alter publication supabase_realtime add table public.orders;
