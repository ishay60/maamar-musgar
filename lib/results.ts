import { db } from "./db";
import { NOT_CONFIGURED } from "./puzzleStore";
import { RANK_LABEL_HE } from "./puzzle/scoring";
import type { Rank } from "./puzzle/engine";
import { deriveStreak } from "./streak";
import type { StreakData } from "./streak";

export interface ResultInput {
  puzzleId: string;
  playerId: string;
  score: number;
  rank: string;
  wrongGuesses: number;
  wrongByNode: Record<string, number>;
  peeks: string[];
  reveals: string[];
  solveOrder: string[];
  durationSeconds: number | null;
  live: boolean;
}

/** Store one result (first finish wins) and return where it lands among today's players. */
export async function saveResult(r: ResultInput): Promise<{ plays: number; percentile: number }> {
  const client = db();
  if (!client) throw new Error(NOT_CONFIGURED);
  await client.from("players").upsert({ id: r.playerId }, { onConflict: "id", ignoreDuplicates: true });
  const { error } = await client.from("results").upsert(
    {
      puzzle_id: r.puzzleId,
      player_id: r.playerId,
      score: r.score,
      rank: r.rank,
      wrong_guesses: r.wrongGuesses,
      wrong_by_node: r.wrongByNode,
      peeks: r.peeks,
      reveals: r.reveals,
      solve_order: r.solveOrder,
      duration_seconds: r.durationSeconds,
      live: r.live,
    },
    { onConflict: "puzzle_id,player_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(`Result save failed: ${error.message}`);
  const [{ count: plays }, { count: below }] = await Promise.all([
    client.from("results").select("*", { count: "exact", head: true }).eq("puzzle_id", r.puzzleId),
    client.from("results").select("*", { count: "exact", head: true }).eq("puzzle_id", r.puzzleId).lt("score", r.score),
  ]);
  const total = plays ?? 1;
  return { plays: total, percentile: total > 1 ? Math.round(((below ?? 0) / (total - 1)) * 100) : 100 };
}

/** A signed-in player's history in the shape the client streak store uses. */
export async function playerHistory(playerId: string, today: string): Promise<StreakData> {
  const client = db();
  if (!client) throw new Error(NOT_CONFIGURED);
  const { data, error } = await client
    .from("results")
    .select("score,rank,live,puzzles(date)")
    .eq("player_id", playerId);
  if (error) throw new Error(`History read failed: ${error.message}`);
  const rows = (data ?? []) as unknown as { score: number; rank: string; live: boolean; puzzles: { date: string } | null }[];
  const completed: StreakData["completed"] = {};
  const liveDates: string[] = [];
  for (const row of rows) {
    const date = row.puzzles?.date;
    if (!date) continue;
    completed[date] = { score: row.score, rank: RANK_LABEL_HE[row.rank as Rank] ?? row.rank };
    if (row.live) liveDates.push(date);
  }
  return { ...deriveStreak(liveDates, today), completed };
}

export async function playerByEmail(email: string): Promise<{ id: string; email: string }> {
  const client = db();
  if (!client) throw new Error(NOT_CONFIGURED);
  const { data } = await client.from("players").select("id,email").eq("email", email).maybeSingle();
  if (data) return data as { id: string; email: string };
  const id = crypto.randomUUID();
  const { error } = await client.from("players").insert({ id, email });
  if (error) throw new Error(`Player create failed: ${error.message}`);
  return { id, email };
}

/** Move a device's results onto the signed-in player, skipping puzzles the account already has. */
export async function mergePlayers(fromDevice: string, into: string): Promise<void> {
  const client = db();
  if (!client || fromDevice === into) return;
  const { data } = await client.from("results").select("puzzle_id").eq("player_id", into);
  const owned = (data ?? []).map((r) => r.puzzle_id as string);
  let q = client.from("results").update({ player_id: into }).eq("player_id", fromDevice);
  if (owned.length) q = q.not("puzzle_id", "in", `(${owned.map((id) => `"${id}"`).join(",")})`);
  await q;
}

export interface PuzzleStats {
  plays: number;
  avgScore: number;
  ranks: Record<string, number>;
  /** Per bracket id: share of players who missed / peeked / revealed it. */
  byNode: Record<string, { wrong: number; peek: number; reveal: number }>;
}

/** Editor-facing distribution for one puzzle. Aggregated in JS; fine for hundreds of players. */
export async function puzzleStats(puzzleId: string): Promise<PuzzleStats | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client.from("results").select("score,rank,wrong_by_node,peeks,reveals").eq("puzzle_id", puzzleId);
  const rows = (data ?? []) as { score: number; rank: string; wrong_by_node: Record<string, number>; peeks: string[]; reveals: string[] }[];
  if (rows.length === 0) return { plays: 0, avgScore: 0, ranks: {}, byNode: {} };
  const ranks: Record<string, number> = {};
  const byNode: PuzzleStats["byNode"] = {};
  const bump = (id: string, k: "wrong" | "peek" | "reveal") => {
    byNode[id] ??= { wrong: 0, peek: 0, reveal: 0 };
    byNode[id][k] += 1;
  };
  for (const r of rows) {
    ranks[r.rank] = (ranks[r.rank] ?? 0) + 1;
    Object.keys(r.wrong_by_node ?? {}).forEach((id) => bump(id, "wrong"));
    r.peeks?.forEach((id) => bump(id, "peek"));
    r.reveals?.forEach((id) => bump(id, "reveal"));
  }
  const n = rows.length;
  for (const v of Object.values(byNode)) {
    v.wrong = Math.round((v.wrong / n) * 100);
    v.peek = Math.round((v.peek / n) * 100);
    v.reveal = Math.round((v.reveal / n) * 100);
  }
  return { plays: n, avgScore: Math.round(rows.reduce((s, r) => s + r.score, 0) / n), ranks, byNode };
}

export async function playerEmail(id: string): Promise<string | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client.from("players").select("email").eq("id", id).maybeSingle();
  return data?.email ?? null;
}
