-- ============================================================
-- Withdrawal Requests Table
-- Run in Supabase SQL Editor after the main migration.sql
-- ============================================================

create table if not exists withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid references sales_reps(id) on delete cascade not null,
  amount numeric not null check (amount >= 100),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'completed')),
  rep_note text,
  admin_note text,
  requested_at timestamptz default now(),
  completed_at timestamptz
);

alter table withdrawal_requests enable row level security;

-- Reps can see their own requests
create policy "Reps can view own withdrawals"
  on withdrawal_requests for select
  using (rep_id in (select id from sales_reps where user_id = auth.uid()));

-- Reps can submit requests
create policy "Reps can insert own withdrawals"
  on withdrawal_requests for insert
  with check (rep_id in (select id from sales_reps where user_id = auth.uid()));

-- Admins can see all
create policy "Admins can view all withdrawals"
  on withdrawal_requests for select
  using (is_admin());

-- Admins can approve/reject/complete
create policy "Admins can update all withdrawals"
  on withdrawal_requests for update
  using (is_admin());

create index if not exists idx_withdrawals_rep_id on withdrawal_requests(rep_id);
create index if not exists idx_withdrawals_status on withdrawal_requests(status);
