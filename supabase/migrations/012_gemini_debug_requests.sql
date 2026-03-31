create table gemini_debug_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  model text,
  parts_count int,
  request_body jsonb
);
