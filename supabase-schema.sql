-- Run this in Supabase SQL Editor
drop table if exists places cascade;

create table if not exists lists (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists items (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references lists(id) on delete cascade,
  name text not null,
  type text not null default '美食',
  category text,
  area text,
  addr_zh text,
  addr_kr text,
  description text,
  source text,
  lat float8,
  lng float8,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table lists disable row level security;
alter table items disable row level security;
