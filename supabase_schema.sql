-- ==============================================================================
-- PULSE MUSIC STUDIO: SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================
-- Run this SQL in your Supabase Project's SQL Editor to enable Google OAuth sync
-- for Profiles, Liked Songs, Custom Playlists, and Playback History.
-- ==============================================================================

-- 1. Profiles Table (Synced from Supabase Auth Google OAuth metadata)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

create policy "Users can view their own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Auto-create profile trigger on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Pulse Listener'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Liked Songs Table
create table if not exists public.liked_songs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  song_id text not null,
  song_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, song_id)
);

alter table public.liked_songs enable row level security;

create policy "Users can view their liked songs"
  on public.liked_songs for select
  using (auth.uid() = user_id);

create policy "Users can insert liked songs"
  on public.liked_songs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete liked songs"
  on public.liked_songs for delete
  using (auth.uid() = user_id);

-- 3. User Playlists Table
create table if not exists public.user_playlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  songs jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_playlists enable row level security;

create policy "Users can view their playlists"
  on public.user_playlists for select
  using (auth.uid() = user_id);

create policy "Users can insert playlists"
  on public.user_playlists for insert
  with check (auth.uid() = user_id);

create policy "Users can update playlists"
  on public.user_playlists for update
  using (auth.uid() = user_id);

create policy "Users can delete playlists"
  on public.user_playlists for delete
  using (auth.uid() = user_id);

-- 4. Playback History Table
create table if not exists public.playback_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  song_data jsonb not null,
  played_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.playback_history enable row level security;

create policy "Users can view their playback history"
  on public.playback_history for select
  using (auth.uid() = user_id);

create policy "Users can insert into playback history"
  on public.playback_history for insert
  with check (auth.uid() = user_id);
