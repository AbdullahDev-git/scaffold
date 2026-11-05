-- Scaffold — Supabase schema.
-- Run once in the SQL editor of a fresh project. Everything a user can read or
-- write lives behind RLS; the only unauthenticated write in the product is a
-- pitch view, which the edge middleware inserts with the anon key.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created by trigger on sign-up
-- ---------------------------------------------------------------------------
create type public.plan_tier as enum ('free', 'pro');
create type public.user_role as enum ('user', 'admin', 'super_admin');

create table public.profiles (
  id              uuid primary key references auth.users on delete cascade,
  full_name       text        not null default '',
  business_name   text        not null default '',
  city            text        not null default '',
  whatsapp        text        not null default '',   -- required at sign-up, used for send + alerts
  tier            plan_tier   not null default 'free',
  role            user_role   not null default 'user',
  credits         integer     not null default 5 check (credits >= 0),
  credits_reset_at timestamptz not null default date_trunc('month', now()) + interval '1 month',
  referral_code   text        not null unique,
  lemonsqueezy_customer_id text,
  notify_on_view  boolean     not null default true,
  notify_weekly   boolean     not null default false,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- pitches: the prototype package plus its lifecycle
-- ---------------------------------------------------------------------------
create type public.pitch_status as enum ('created', 'sent', 'viewed', 'in_discussion', 'won', 'lost');

create table public.pitches (
  id            text        primary key,             -- human readable, e.g. PT-4181
  owner         uuid        not null references public.profiles(id) on delete cascade,
  slug          text        not null unique,         -- public url segment: /p/<slug>
  client_name   text        not null,
  industry      text        not null,
  brief         text        not null default '',
  mode          text        not null default 'type' check (mode in ('type', 'voice')),
  status        pitch_status not null default 'created',
  package       jsonb       not null,                -- validated PitchPackage, never raw model output
  hidden_sections text[]    not null default '{}',
  provider      text,                                -- gemini | mistral | local
  created_at    timestamptz not null default now(),
  sent_at       timestamptz,
  status_at     timestamptz not null default now()
);

create index pitches_owner_created_idx on public.pitches (owner, created_at desc);
create index pitches_slug_idx on public.pitches (slug);

-- ---------------------------------------------------------------------------
-- pitch_views: written by the edge middleware on every real (non-bot) open.
-- Column shape matches the middleware insert exactly.
-- ---------------------------------------------------------------------------
create table public.pitch_views (
  id          bigint generated always as identity primary key,
  pitch_slug  text        not null,
  viewed_at   timestamptz not null default now(),
  device      text        not null default 'desktop',
  city        text,
  source      text,                                  -- whatsapp | direct | referral host
  user_agent  text,
  seconds     integer                                -- filled in by the beacon on unload
);

create index pitch_views_slug_idx on public.pitch_views (pitch_slug, viewed_at desc);

-- ---------------------------------------------------------------------------
-- referrals: an invite is a row; it pays out credits once the invitee signs up
-- ---------------------------------------------------------------------------
create table public.referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer     uuid not null references public.profiles(id) on delete cascade,
  invitee      uuid references public.profiles(id) on delete set null,
  invitee_name text not null default '',
  status       text not null default 'invited' check (status in ('invited', 'signed_up', 'credited')),
  credits      integer not null default 0,
  created_at   timestamptz not null default now()
);

create index referrals_referrer_idx on public.referrals (referrer, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.pitches     enable row level security;
alter table public.pitch_views enable row level security;
alter table public.referrals   enable row level security;

-- profiles: you see and edit only yourself. Tier and credits are written by the
-- Stripe webhook and server actions using the service role key, which bypasses RLS.
create policy "read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- pitches: private to the owner in the app. The public /p/<slug> page is
-- rendered on the server with the service role key, so no anon select is needed.
create policy "read own pitches"   on public.pitches for select using (auth.uid() = owner);
create policy "write own pitches"  on public.pitches for insert with check (auth.uid() = owner);
create policy "update own pitches" on public.pitches for update using (auth.uid() = owner) with check (auth.uid() = owner);
create policy "delete own pitches" on public.pitches for delete using (auth.uid() = owner);

-- pitch_views: the visitor is anonymous, so anon may insert but never read.
-- Owners read the views belonging to their own pitches.
create policy "log a view" on public.pitch_views for insert to anon, authenticated with check (true);
create policy "read views on own pitches" on public.pitch_views for select using (
  exists (select 1 from public.pitches p where p.slug = pitch_views.pitch_slug and p.owner = auth.uid())
);

-- referrals: visible to the person who sent them.
create policy "read own referrals"  on public.referrals for select using (auth.uid() = referrer);
create policy "write own referrals" on public.referrals for insert with check (auth.uid() = referrer);

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
  );
  return new;
end;
$$;

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

-- ---------------------------------------------------------------------------
-- Admin audit log — every admin action is recorded here
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
-- System settings — key-value store for admin-configurable values
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
-- Row level security for admin tables
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

-- system_settings: public read for pricing display
create policy "public read settings"
  on public.system_settings for select
  using (true);

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
