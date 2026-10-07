-- =============================================================================
-- LumiVue Auth Migration for Supabase
-- Version: 20261007_002_auth_rls_policies.sql
-- Description: Updates Row Level Security policies to enforce per-user access
--              using Supabase Auth (auth.uid()).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add user_id column to patients table
-- -----------------------------------------------------------------------------
alter table public.patients
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- -----------------------------------------------------------------------------
-- 2. Add user_id column to radiographs table
-- -----------------------------------------------------------------------------
alter table public.radiographs
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- -----------------------------------------------------------------------------
-- 3. Add user_id column to analyses table
-- -----------------------------------------------------------------------------
alter table public.analyses
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- -----------------------------------------------------------------------------
-- 4. Create indexes on user_id for fast lookups
-- -----------------------------------------------------------------------------
create index if not exists idx_patients_user_id on public.patients (user_id);
create index if not exists idx_radiographs_user_id on public.radiographs (user_id);
create index if not exists idx_analyses_user_id on public.analyses (user_id);

-- -----------------------------------------------------------------------------
-- 5. Drop old permissive policies (they allowed any user to read/write all)
-- -----------------------------------------------------------------------------
drop policy if exists "Enable read access for all users" on public.patients;
drop policy if exists "Enable insert access for all users" on public.patients;
drop policy if exists "Enable read access for all users" on public.radiographs;
drop policy if exists "Enable insert access for all users" on public.radiographs;
drop policy if exists "Enable read access for all users" on public.analyses;
drop policy if exists "Enable insert access for all users" on public.analyses;
drop policy if exists "Enable update access for all users" on public.analyses;

-- -----------------------------------------------------------------------------
-- 6. New RLS policies: Users can only CRUD their own records
-- -----------------------------------------------------------------------------

-- Patients
create policy "Users can view own patients"
  on public.patients for select
  using (auth.uid() = user_id);

create policy "Users can insert own patients"
  on public.patients for insert
  with check (auth.uid() = user_id);

create policy "Users can update own patients"
  on public.patients for update
  using (auth.uid() = user_id);

-- Radiographs
create policy "Users can view own radiographs"
  on public.radiographs for select
  using (auth.uid() = user_id);

create policy "Users can insert own radiographs"
  on public.radiographs for insert
  with check (auth.uid() = user_id);

-- Analyses
create policy "Users can view own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own analyses"
  on public.analyses for update
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 7. Create a profiles table for user metadata
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    full_name text,
    email text,
    role text default 'clinician'
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 8. Auto-create profile on user sign-up (Supabase trigger)
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if any
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
