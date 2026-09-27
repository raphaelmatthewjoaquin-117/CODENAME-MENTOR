-- Teacher's Day Appreciation Board
-- Paste this entire file into the Supabase SQL Editor and click Run.

create extension if not exists pgcrypto;

create table if not exists public.professors (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  display_name text not null
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  professor_id uuid not null references public.professors(id) on delete cascade,
  sender_name text default 'Anonymous',
  message_content text not null,
  status text not null default 'pending'
);

create index if not exists messages_professor_id_idx on public.messages (professor_id);
create index if not exists messages_status_idx on public.messages (status);

-- STUDENT PROJECT: disable RLS so the custom frontend login can read/write freely.
-- (The frontend already gates professor dashboards and the admin page.)
alter table public.professors disable row level security;
alter table public.messages disable row level security;

-- Realtime: stream INSERT/UPDATE/DELETE on messages to the admin dashboard.
alter table public.messages replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end $$;

-- Optional sample professors. Change these usernames/passwords before sharing.
insert into public.professors (username, password, display_name)
values
  ('drsmith', 'welcome123', 'Dr. Smith'),
  ('proflee', 'welcome123', 'Prof. Lee'),
  ('drpatel', 'welcome123', 'Dr. Patel')
on conflict (username) do nothing;

-- ---------------------------------------------------------------------------
-- OPTIONAL: enable RLS later with these policies instead of disabling it.
-- Uncomment the block below if you want table-level rules instead of open access.
-- ---------------------------------------------------------------------------
/*
alter table public.professors enable row level security;
alter table public.messages enable row level security;

drop policy if exists "public can read professors" on public.professors;
create policy "public can read professors"
  on public.professors for select
  using (true);

drop policy if exists "public can insert messages" on public.messages;
create policy "public can insert messages"
  on public.messages for insert
  with check (true);

drop policy if exists "public can read messages" on public.messages;
create policy "public can read messages"
  on public.messages for select
  using (true);

drop policy if exists "public can update message status" on public.messages;
create policy "public can update message status"
  on public.messages for update
  using (true)
  with check (true);
*/
