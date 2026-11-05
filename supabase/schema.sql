-- Scaffold — Supabase schema (idempotent — safe to run multiple times)
-- Run in the SQL editor of your Supabase project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Types (guarded against duplicate creation)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.plan_tier AS ENUM ('free', 'pro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created by trigger on sign-up
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id              uuid primary key references auth.users on delete cascade,
  full_name       text        not null default '',
  business_name   text        not null default '',
  city            text        not null default '',
  whatsapp        text        not null default '',   -- required at sign-up, used for send + alerts
  tier            public.plan_tier   not null default 'free',
  role            public.user_role   not null default 'user',
  credits         integer     not null default 5 check (credits >= 0),
  credits_reset_at timestamptz not null default date_trunc('month', now()) + interval '1 month',
  referral_code   text        not null unique,
  lemonsqueezy_customer_id text,
  notify_on_view  boolean     not null default true,
  notify_weekly   boolean     not null default false,
  created_at      timestamptz not null default now()
);

-- Add role column if table already existed without it
alter table public.profiles
add column if not exists role public.user_role not null default 'user';

-- ---------------------------------------------------------------------------
-- pitches: the prototype package plus its lifecycle
-- ---------------------------------------------------------------------------

create table if not exists public.pitches (
  id            text        primary key,
  owner         uuid        not null references public.profiles(id) on delete cascade,
  slug          text        not null unique,
  client_name   text        not null,
  industry      text        not null,
  brief         text        not null default '',
  mode          text        not null default 'type' check (mode in ('type', 'voice')),
  status        text        not null default 'created',
  package       jsonb       not null,
  hidden_sections text[]    not null default '{}',
  provider      text,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz,
  status_at     timestamptz not null default now()
);

create index if not exists pitches_owner_created_idx on public.pitches (owner, created_at desc);
create index if not exists pitches_slug_idx on public.pitches (slug);

-- ---------------------------------------------------------------------------
-- pitch_views: written by the edge middleware on every real (non-bot) open.
-- Column shape matches the middleware insert exactly.
-- ---------------------------------------------------------------------------

create table if not exists public.pitch_views (
  id          bigint generated always as identity primary key,
  pitch_slug  text        not null,
  viewed_at   timestamptz not null default now(),
  device      text        not null default 'desktop',
  city        text,
  source      text,
  user_agent  text,
  seconds     integer
);

create index if not exists pitch_views_slug_idx on public.pitch_views (pitch_slug, viewed_at desc);

-- ---------------------------------------------------------------------------
-- referrals: an invite is a row; it pays out credits once the invitee signs up
-- ---------------------------------------------------------------------------

create table if not exists public.referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer     uuid not null references public.profiles(id) on delete cascade,
  invitee      uuid references public.profiles(id) on delete set null,
  invitee_name text not null default '',
  status       text not null default 'invited' check (status in ('invited', 'signed_up', 'credited')),
  credits      integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists referrals_referrer_idx on public.referrals (referrer, created_at desc);

-- ---------------------------------------------------------------------------
-- admin_audit_log — every admin action is recorded here
-- ---------------------------------------------------------------------------

create table if not exists public.admin_audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid        not null references public.profiles(id) on delete cascade,
  action      text        not null,
  target_type text        not null,
  target_id   text,
  detail      jsonb       not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists audit_actor_idx   on public.admin_audit_log (actor_id, created_at desc);
create index if not exists audit_target_idx  on public.admin_audit_log (target_type, target_id, created_at desc);
create index if not exists audit_action_idx  on public.admin_audit_log (action, created_at desc);

-- ---------------------------------------------------------------------------
-- system_settings — key-value store for admin-configurable values
-- ---------------------------------------------------------------------------

create table if not exists public.system_settings (
  key         text primary key,
  value       jsonb       not null,
  description text        not null default '',
  updated_by  uuid        references public.profiles(id) on delete set null,
  updated_at  timestamptz not null default now()
);

insert into public.system_settings (key, value, description) values
  ('free_monthly_credits', '5', 'Number of credits free-tier users receive each month'),
  ('referral_bonus_credits', '2', 'Credits awarded to referrer and invitee per successful referral'),
  ('max_free_pitches', '5', 'Monthly pitch allowance for free-tier accounts'),
  ('pro_price_monthly', '"$19/mo"', 'Display price for Pro plan'),
  ('maintenance_mode', 'false', 'When true, the app shows a maintenance banner')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.pitch_views ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

-- policies (guarded)

DO $$ BEGIN
  CREATE POLICY "read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "read own pitches" ON public.pitches FOR SELECT USING (auth.uid() = owner);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "write own pitches" ON public.pitches FOR INSERT WITH CHECK (auth.uid() = owner);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "update own pitches" ON public.pitches FOR UPDATE USING (auth.uid() = owner) WITH CHECK (auth.uid() = owner);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "delete own pitches" ON public.pitches FOR DELETE USING (auth.uid() = owner);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "log a view" ON public.pitch_views FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "read views on own pitches" ON public.pitch_views FOR SELECT USING (
    exists (select 1 from public.pitches p where p.slug = pitch_views.pitch_slug and p.owner = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "read own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "write own referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admins read audit log" ON public.admin_audit_log FOR SELECT USING (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admins read settings" ON public.system_settings FOR SELECT USING (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "public read settings" ON public.system_settings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admins update settings" ON public.system_settings FOR UPDATE USING (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  ) WITH CHECK (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Sign-up trigger: create the profile row with a referral code
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, business_name, city, whatsapp, role, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'business_name', ''),
    coalesce(new.raw_user_meta_data ->> 'city', ''),
    coalesce(new.raw_user_meta_data ->> 'whatsapp', ''),
    'user',
    'SCAFFOLD-' || upper(substr(replace(new.id::text, '-', ''), 1, 6))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Monthly credit reset for free accounts (pg_cron, or call from a route handler)
-- ---------------------------------------------------------------------------

create or replace function public.reset_monthly_credits()
returns void
language sql
as $$
  update public.profiles
     set credits = 5,
         credits_reset_at = date_trunc('month', now()) + interval '1 month'
   where tier = 'free'
     and credits_reset_at <= now();
$$;
