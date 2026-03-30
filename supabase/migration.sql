-- ============================================================
-- Westline Techlabs — Sales Portal: Supabase Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Sales Reps
create table if not exists sales_reps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text not null,
  email text not null,
  phone text,
  region text,
  role text not null default 'rep' check (role in ('rep', 'admin')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now()
);

-- 2. Sales Bookings
create table if not exists sales_bookings (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid references sales_reps(id) on delete cascade not null,
  client_name text not null,
  client_phone text not null,
  client_email text,
  client_location text,
  service_type text not null,
  service_details jsonb default '{}',
  project_value numeric not null default 0,
  commission_earned numeric not null default 0,
  notes text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Sales Targets
create table if not exists sales_targets (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid references sales_reps(id) on delete cascade not null,
  period text not null,
  target_amount numeric not null default 0,
  achieved_amount numeric not null default 0,
  unique(rep_id, period)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table sales_reps enable row level security;
alter table sales_bookings enable row level security;
alter table sales_targets enable row level security;

-- --- sales_reps policies ---

create policy "Users can read own profile"
  on sales_reps for select
  using (auth.uid() = user_id);

create policy "Admins can read all reps"
  on sales_reps for select
  using (
    exists (
      select 1 from sales_reps sr
      where sr.user_id = auth.uid() and sr.role = 'admin'
    )
  );

create policy "Users can insert own profile"
  on sales_reps for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on sales_reps for update
  using (auth.uid() = user_id);

-- --- sales_bookings policies ---

create policy "Reps can read own bookings"
  on sales_bookings for select
  using (
    rep_id in (select id from sales_reps where user_id = auth.uid())
  );

create policy "Admins can read all bookings"
  on sales_bookings for select
  using (
    exists (
      select 1 from sales_reps
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Reps can insert own bookings"
  on sales_bookings for insert
  with check (
    rep_id in (select id from sales_reps where user_id = auth.uid())
  );

create policy "Reps can update own bookings"
  on sales_bookings for update
  using (
    rep_id in (select id from sales_reps where user_id = auth.uid())
  );

create policy "Admins can update all bookings"
  on sales_bookings for update
  using (
    exists (
      select 1 from sales_reps
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- --- sales_targets policies ---

create policy "Reps can read own targets"
  on sales_targets for select
  using (
    rep_id in (select id from sales_reps where user_id = auth.uid())
  );

create policy "Admins can read all targets"
  on sales_targets for select
  using (
    exists (
      select 1 from sales_reps
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can manage targets"
  on sales_targets for all
  using (
    exists (
      select 1 from sales_reps
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- Auto-update updated_at on sales_bookings
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on sales_bookings
  for each row execute function update_updated_at();

-- ============================================================
-- Index for performance
-- ============================================================

create index if not exists idx_bookings_rep_id on sales_bookings(rep_id);
create index if not exists idx_bookings_status on sales_bookings(status);
create index if not exists idx_targets_rep_id on sales_targets(rep_id);
create index if not exists idx_reps_user_id on sales_reps(user_id);
