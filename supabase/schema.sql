-- Jalankan seluruh SQL ini di Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24),
  display_name text not null default 'Traveler',
  xp integer not null default 0 check (xp >= 0),
  coins integer not null default 120 check (coins >= 0),
  avatar jsonb not null default '{"name":"Mochi","gender":"Laki-laki","owned":["basic-shirt","denim-pants"],"equipped":{"top":"basic-shirt","bottom":"denim-pants"}}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  city text not null, days integer not null default 1, interests text[] not null default '{}', budget numeric not null default 0,
  itinerary jsonb not null default '[]'::jsonb, status text not null default 'planned', created_at timestamptz not null default now()
);
create table if not exists public.visited_destinations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  destination_name text not null, city text not null, visited_at timestamptz not null default now(), xp_awarded integer not null default 10, coins_awarded integer not null default 10,
  unique(user_id, destination_name, city)
);
create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade, achievement_id text not null,
  unlocked_at timestamptz not null default now(), primary key(user_id, achievement_id)
);
create table if not exists public.avatar_inventory (
  user_id uuid not null references auth.users(id) on delete cascade, item_id text not null,
  acquired_at timestamptz not null default now(), primary key(user_id, item_id)
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), coalesce(new.raw_user_meta_data->>'username', 'Traveler'))
  on conflict (id) do nothing;
  insert into public.avatar_inventory(user_id, item_id) values (new.id, 'basic-shirt'), (new.id, 'denim-pants') on conflict do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.visited_destinations enable row level security;
alter table public.user_achievements enable row level security;
alter table public.avatar_inventory enable row level security;
create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "trips own all" on public.trips for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "visited own all" on public.visited_destinations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "achievements own all" on public.user_achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "inventory own all" on public.avatar_inventory for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
