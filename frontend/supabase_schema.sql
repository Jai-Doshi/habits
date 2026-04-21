-- ═══════════════════════════════════════════════════════════════
--  HabitFlow — Supabase Database Schema (with Auth)
--  Run this entire file in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── Enable UUID extension ───────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────
-- Linked to Supabase auth.users via id = auth.uid()
create table if not exists profiles (
  id            text        primary key,   -- auth.uid() cast to text
  display_name  text        not null default 'User',
  avatar_emoji  text        not null default '😊',
  total_points  integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── HABITS ──────────────────────────────────────────────────────
create table if not exists habits (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     text        not null references profiles(id) on delete cascade,
  name        text        not null,
  emoji       text        not null default '🎯',
  points      integer     not null default 3 check (points between 1 and 5),
  color       text        not null default 'linear-gradient(135deg, #7c3aed, #a855f7)',
  category    text        not null default 'Other',
  start_date  date        not null,
  end_date    date        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists habits_user_id_idx on habits(user_id);

-- ─── HABIT LOGS ──────────────────────────────────────────────────
create table if not exists habit_logs (
  id          uuid        primary key default uuid_generate_v4(),
  habit_id    uuid        not null references habits(id) on delete cascade,
  user_id     text        not null references profiles(id) on delete cascade,
  log_date    date        not null,
  completed   boolean     not null default true,
  created_at  timestamptz not null default now(),

  unique (habit_id, log_date)
);

create index if not exists habit_logs_user_date_idx on habit_logs(user_id, log_date);
create index if not exists habit_logs_habit_id_idx  on habit_logs(habit_id);

-- ─── AUTO-UPDATE updated_at TRIGGER ─────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger habits_updated_at
  before update on habits
  for each row execute function set_updated_at();

create or replace trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────────
-- This trigger fires whenever a new user signs up via Supabase Auth
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id::text,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop and recreate trigger cleanly
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────
-- Each user can only see and modify their own data

alter table profiles   enable row level security;
alter table habits     enable row level security;
alter table habit_logs enable row level security;

-- PROFILES
drop policy if exists "profiles_self" on profiles;
create policy "profiles_self" on profiles
  for all using (id = auth.uid()::text);

-- HABITS
drop policy if exists "habits_owner" on habits;
create policy "habits_owner" on habits
  for all using (user_id = auth.uid()::text);

-- HABIT LOGS
drop policy if exists "logs_owner" on habit_logs;
create policy "logs_owner" on habit_logs
  for all using (user_id = auth.uid()::text);

-- ─── VERIFY ──────────────────────────────────────────────────────
select 'HabitFlow schema with auth ready ✅' as status;
