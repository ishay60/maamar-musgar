# Design decisions

Decided 2026-09-15 in a grilling session. Decisions only; change this file when a decision changes.

## Product

- Public, free Hebrew daily word puzzle. Web only, mobile first. Target: hundreds of daily players, zero-cost infra.
- One puzzle per Israel-time date. Archive is free to play. Only today's puzzle moves the streak.
- Editors keep a buffer of about one month of scheduled puzzles.

## Backend: Supabase

One Postgres project holds everything. Git no longer stores puzzles.

| Table | Columns |
|---|---|
| `puzzles` | id, date (unique), status (`draft` / `scheduled`), bracket_string, specs jsonb, final_sentence, historical_context, tags, difficulty, updated_by, updated_at |
| `results` | id, puzzle_id, player_id, score, rank, wrong_guesses, peeks, reveals, hardest_bracket, solve_order int[], duration_seconds, created_at. Unique (puzzle_id, player_id). Index (puzzle_id, score). |
| `players` | id, auth_user_id nullable, created_at |
| `editors` | email |
| `events_cache` | month_day, source, payload jsonb, fetched_at |

- "Published" is derived: `status = scheduled AND date <= today (Israel)`.
- The existing `data/puzzles.json` is imported once, then deleted along with the GitHub commit pipeline (`GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`, `ADMIN_PASSWORD`). Revoke the token.
- `data/historical-events.json` stays in the repo as curated seed data.
- Percentiles are computed live with a count query. No rollups.

## Admin studio

- Auth: Supabase magic link, allowlist in `editors`. No shared password. `WORKSPACE=local` still bypasses auth in development.
- Two states only: draft and scheduled. Editors see all puzzles.
- Builder autosaves drafts (debounced). Explicit "schedule" toggle. Last write wins; `updated_at` is shown so collisions are visible. No locking until two editors actually collide.
- Calendar keeps red/green days, plus a badge and one line at the top of the studio: "scheduled through <date>, N days".
- Research search lives in the builder sidebar only. It searches by date, keyword, or year across: curated events (ranked first), cached Hebrew Wikipedia "on this day" pages fetched on demand, and an "expand" button that sends a chosen event to Claude and returns three candidate final sentences plus quotes. No separate research page.

## Players

- Anonymous by default. A device id is generated on first visit, stored in localStorage and mirrored to a long-lived cookie.
- Every finish posts one result per device per puzzle. Trust model: rate limit, uniqueness constraint, outlier clipping when aggregating. Server-side score recomputation is deferred until leaderboards exist.
- End-game screen shows: today's percentile by score, rank distribution bar, hardest bracket of the day. No HUD stats icon until sign-in ships.
- Later: optional magic-link sign-in. Signing in sets `players.auth_user_id`. Signing in on a device that has its own anonymous history merges both, re-pointing results and ignoring per-puzzle duplicates.
- After sign-in the streak is derived on the server from completion dates, never stored as a counter. The local streak is a cache for anonymous players only.

## Explicitly out of scope

Native apps, widgets, newsletters, bots. Real-time collaboration or locking. Leaderboards. Difficulty tracks. Preview links for testers. Nightly rollups.

## Build order

Each step ships on its own.

1. Supabase project, `puzzles` table, import script, studio reads and writes the database, git pipeline deleted.
2. Editor magic-link auth with allowlist.
3. Anonymous results plus end-game percentile, distribution, hardest bracket.
4. Wikipedia events cache, sidebar search, LLM expand.
5. Player sign-in with claim and merge, server-derived streak.

## Reference

Bracket City (The Atlantic) uses the same model: anonymous play, optional sign-in that syncs streak and stats across devices, a rank per puzzle.
