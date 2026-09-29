import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "./fakeSupabase";

/**
 * A player's history must survive signing in, on every device, whatever the
 * server has. Runs the real server code (lib/results.ts) against an in-memory
 * database and the real page-load merge (hydrateStreak), step by step as the
 * app does it: sign in → merge devices → load account → merge with this
 * browser → upload what the account lacks → open on another device.
 */
const holder = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("../db", () => ({ db: () => holder.client }));

import { importHistory, mergePlayers, playerByEmail, playerHistory, saveResult } from "../results";
import { emptyStreak, hydrateStreak } from "../streak";
import type { StreakData } from "../streak";

type Row = Record<string, unknown>;
const TODAY = "2026-09-24";
const DEVICE = "11111111-1111-4111-8111-111111111111";
// Lian's history from the report: 7 played, current and best streak 6.
const PLAYED = ["2026-09-15", "2026-09-18", "2026-09-19", "2026-09-20", "2026-09-21", "2026-09-22", "2026-09-23"];

let tables: Record<string, Row[]>;
beforeEach(() => {
  tables = {
    puzzles: ["2026-09-15", "2026-09-16", "2026-09-17", ...PLAYED.slice(1), TODAY].map((date) => ({
      id: `p-${date}`,
      date,
      status: "scheduled",
      max_score: 100,
    })),
    players: [],
    results: [],
  };
  holder.client = fakeSupabase(tables);
});

const browser = (over: Partial<StreakData> = {}): StreakData => ({
  current: 6,
  longest: 6,
  lastPuzzleDate: "2026-09-23",
  completed: Object.fromEntries(PLAYED.map((d, i) => [d, { score: 60 + i * 5, rank: "ראש עיר" }])),
  ...over,
});

/** What the app does from clicking the magic link to the page being shown. */
async function signInAndLoad(email: string, local: StreakData, device = DEVICE) {
  const player = await playerByEmail(email); // /api/auth/session
  await mergePlayers(device, player.id);
  const seed = await playerHistory(player.id, TODAY); // app/page.tsx
  const { data, missing } = hydrateStreak(local, seed, TODAY); // useStreak on mount
  await importHistory(player.id, missing, TODAY); // POST /api/results/import
  return { player, shown: data };
}

const resultsOf = (playerId: string) => tables.results.filter((r) => r.player_id === playerId);

describe("signing in keeps the player's history", () => {
  it("browser-only history: nothing lost on sign-in, and it reaches the account", async () => {
    const { player, shown } = await signInAndLoad("lian@example.com", browser());

    expect(Object.keys(shown.completed).sort()).toEqual(PLAYED);
    expect(shown.current).toBe(6);
    expect(shown.longest).toBe(6);
    expect(resultsOf(player.id)).toHaveLength(7);

    // Another device, nothing stored locally: the account alone shows the same history.
    const elsewhere = hydrateStreak(emptyStreak, await playerHistory(player.id, TODAY), TODAY).data;
    expect(Object.keys(elsewhere.completed).sort()).toEqual(PLAYED);
    expect(elsewhere.completed["2026-09-23"]).toEqual(browser().completed["2026-09-23"]);
    expect(elsewhere.current).toBe(6);
    expect(elsewhere.longest).toBe(6);
  });

  it("a browser whose streak an earlier build zeroed gets it back", async () => {
    const completed = Object.fromEntries(PLAYED.map((date, i) => [date, { score: 60 + i * 5, rank: "ראש עיר", live: true }]));
    const wiped = browser({ current: 0, longest: 0, lastPuzzleDate: null, completed });
    const { player, shown } = await signInAndLoad("lian@example.com", wiped);

    expect(shown.current).toBe(6);
    expect(shown.longest).toBe(6);
    expect(resultsOf(player.id)).toHaveLength(7);
  });

  it("anonymous plays, a signed-in play on another device and this browser all end up together", async () => {
    const ACCOUNT = "22222222-2222-4222-8222-222222222222";
    // Months ago, played anonymously in this browser after results started being stored.
    await saveResult({
      puzzleId: "p-2026-09-15", playerId: DEVICE, score: 88, rank: "mayor", wrongGuesses: 1, wrongByNode: {},
      peeks: [], reveals: [], solveOrder: [], durationSeconds: 60, live: true,
    });
    // Signed in on the phone already: played today there, and 09-22 with a worse score than this browser's.
    tables.players.push({ id: ACCOUNT, email: "lian@example.com" });
    tables.results.push(
      { puzzle_id: `p-${TODAY}`, player_id: ACCOUNT, score: 95, rank: "kingmaker", live: true },
      { puzzle_id: "p-2026-09-22", player_id: ACCOUNT, score: 40, rank: "tourist", live: true },
    );

    const { player, shown } = await signInAndLoad("lian@example.com", browser());

    expect(player.id).toBe(ACCOUNT);
    expect(Object.keys(shown.completed).sort()).toEqual([...PLAYED, TODAY]);
    expect(resultsOf(ACCOUNT)).toHaveLength(8);
    expect(resultsOf(DEVICE)).toHaveLength(0);
    // First finish wins: the account's stored result is kept, not overwritten.
    expect(resultsOf(ACCOUNT).find((r) => r.puzzle_id === "p-2026-09-22")?.score).toBe(40);
    // 6 days here (09-18..09-23) + today on the phone = 7, on the very first load.
    expect(shown.current).toBe(7);
    expect(shown.longest).toBe(7);
  });

  it("loading again changes nothing and adds no duplicates", async () => {
    const first = await signInAndLoad("lian@example.com", browser());
    const again = await signInAndLoad("lian@example.com", first.shown);

    expect(again.player.id).toBe(first.player.id);
    expect(resultsOf(first.player.id)).toHaveLength(7);
    expect(again.shown).toEqual(first.shown);
  });

  it("an anonymous player's history is left exactly as it is", () => {
    const local = browser();
    expect(hydrateStreak(local, undefined, TODAY)).toEqual({ data: local, missing: [] });
  });
});
