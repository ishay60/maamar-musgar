-- Players: anonymous device ids (client-generated uuid) and, after magic-link
-- sign-in, an email. Signing in on a device re-points that device's results.
create table players (
  id uuid primary key,
  email text unique,
  created_at timestamptz not null default now()
);

-- One result per player per puzzle. `live` = solved on the puzzle's own date,
-- which is the only thing that moves the streak.
create table results (
  puzzle_id text not null references puzzles(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  score int not null,
  rank text not null,
  wrong_guesses int not null default 0,
  wrong_by_node jsonb not null default '{}',
  peeks text[] not null default '{}',
  reveals text[] not null default '{}',
  solve_order text[] not null default '{}',
  duration_seconds int,
  live boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (puzzle_id, player_id)
);
create index results_puzzle_score on results (puzzle_id, score);
create index results_player on results (player_id);

-- Clue library: every bracket ever saved, keyed by clue text, so the studio can
-- offer "you already asked this" suggestions. Rewritten on each puzzle save.
create table clues (
  puzzle_id text not null references puzzles(id) on delete cascade,
  position int not null,
  clue text not null,
  answer text not null,
  accepted_answers text[] not null default '{}',
  clue_type text,
  difficulty text,
  primary key (puzzle_id, position)
);
create index clues_clue on clues (clue);

alter table players enable row level security;
alter table results enable row level security;
alter table clues enable row level security;
grant all on players, results, clues to service_role;
