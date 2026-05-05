-- Analytics table for user-saved material palettes.
-- No auth required — anonymous inserts capture palette saves for design insights.

create table if not exists public.saved_palettes (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  showroom_id   text,
  room_category text,
  materials     jsonb       not null
);

-- Allow anonymous inserts (analytics only — no reads needed from the client)
alter table public.saved_palettes enable row level security;

create policy "Anyone can insert saved palettes"
  on public.saved_palettes for insert
  with check (true);
