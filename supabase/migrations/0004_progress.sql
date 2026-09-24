-- Per-puzzle game state for signed-in players, so a half-solved puzzle resumes
-- on any device. `state` is lib/progress.ts SavedProgress. Anonymous players
-- keep the same shape in localStorage only.
create table progress (
  player_id uuid not null references players(id) on delete cascade,
  puzzle_id text not null references puzzles(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (player_id, puzzle_id)
);

alter table progress enable row level security;
grant all on progress to service_role;
