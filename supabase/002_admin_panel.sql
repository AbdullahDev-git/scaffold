-- Scaffold — Admin panel migration.
-- Run this AFTER the base schema.sql in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- 1. Add role column to profiles
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('user', 'admin', 'super_admin');

alter table public.profiles
  add column role public.user_role not null default 'user';

create index profiles_role_idx on public.profiles (role) where role in ('admin', 'super_admin');

-- ---------------------------------------------------------------------------
-- 2. Admin audit log — every admin action is recorded here
-- ---------------------------------------------------------------------------
create table public.admin_audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid        not null references public.profiles(id) on delete cascade,
  action      text        not null,   -- e.g. 'user.promote', 'pitch.delete', 'credit.grant'
  target_type text        not null,   -- 'profile', 'pitch', 'system'
  target_id   text,                   -- uuid or pitch id of the affected entity
  detail      jsonb       not null default '{}',
  created_at  timestamptz not null default now()
);

create index audit_actor_idx   on public.admin_audit_log (actor_id, created_at desc);
create index audit_target_idx  on public.admin_audit_log (target_type, target_id, created_at desc);
create index audit_action_idx  on public.admin_audit_log (action, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. System settings — key-value store for admin-configurable values
-- ---------------------------------------------------------------------------
create table public.system_settings (
  key         text primary key,
  value       jsonb       not null,
  description text        not null default '',
  updated_by  uuid        references public.profiles(id) on delete set null,
  updated_at  timestamptz not null default now()
);

-- Seed defaults
insert into public.system_settings (key, value, description) values
  ('free_monthly_credits', '5', 'Number of credits free-tier users receive each month'),
  ('referral_bonus_credits', '2', 'Credits awarded to referrer and invitee per successful referral'),
  ('max_free_pitches', '5', 'Monthly pitch allowance for free-tier accounts'),
  ('pro_price_monthly', '"$19/mo"', 'Display price for Pro plan'),
  ('maintenance_mode', 'false', 'When true, the app shows a maintenance banner');

-- ---------------------------------------------------------------------------
-- 4. RLS policies for admin tables
-- ---------------------------------------------------------------------------
alter table public.admin_audit_log enable row level security;
alter table public.system_settings enable row level security;

-- admin_audit_log: only admins can read; writes go through service role
create policy "admins read audit log"
  on public.admin_audit_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- system_settings: only admins can read and update
create policy "admins read settings"
  on public.system_settings for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

create policy "admins update settings"
  on public.system_settings for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );
