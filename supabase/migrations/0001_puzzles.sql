-- Puzzles: the studio writes, the game reads. Server-only access via the
-- service role key; RLS is on with no policies so the anon key sees nothing.
create table puzzles (
  id text primary key,
  date date not null unique,
  status text not null default 'scheduled' check (status in ('draft', 'scheduled')),
  bracket_string text not null,
  specs jsonb not null,
  final_sentence text not null,
  historical_context text,
  max_score int,
  tags text[] not null default '{}',
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table puzzles enable row level security;

-- "Automatically expose new tables" is off on the project, so grant the
-- server role explicitly. anon and authenticated get nothing.
grant all on puzzles to service_role;
