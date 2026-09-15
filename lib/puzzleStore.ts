import { db } from "./db";
import type { BuildPuzzleInput } from "./puzzle/build";
import type { Puzzle } from "./puzzle/types";
import { buildAll } from "./puzzle/puzzles";

export type PuzzleStatus = "draft" | "scheduled";
export type StoredPuzzle = BuildPuzzleInput & { status: PuzzleStatus };

/** Database row shape for the `puzzles` table. */
export interface PuzzleRow {
  id: string;
  date: string;
  status: PuzzleStatus;
  bracket_string: string;
  specs: BuildPuzzleInput["specs"];
  final_sentence: string;
  historical_context: string | null;
  max_score: number | null;
  tags: string[];
  difficulty: BuildPuzzleInput["difficulty"] | null;
}

export function rowToInput(row: PuzzleRow): StoredPuzzle {
  return {
    id: row.id,
    date: row.date,
    status: row.status,
    bracketString: row.bracket_string,
    specs: row.specs,
    finalSentence: row.final_sentence,
    historicalContext: row.historical_context ?? undefined,
    maxScore: row.max_score ?? undefined,
    tags: row.tags,
    difficulty: row.difficulty ?? undefined,
  };
}

export function inputToRow(p: StoredPuzzle): PuzzleRow {
  return {
    id: p.id,
    date: p.date,
    status: p.status,
    bracket_string: p.bracketString,
    specs: p.specs,
    final_sentence: p.finalSentence,
    historical_context: p.historicalContext ?? null,
    max_score: p.maxScore ?? null,
    tags: p.tags ?? [],
    difficulty: p.difficulty ?? null,
  };
}

export const NOT_CONFIGURED = "Database not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).";

const COLUMNS =
  "id,date,status,bracket_string,specs,final_sentence,historical_context,max_score,tags,difficulty";

async function loadRows(publishedBefore?: string): Promise<PuzzleRow[]> {
  const client = db();
  if (!client) return [];
  let q = client.from("puzzles").select(COLUMNS).order("date");
  if (publishedBefore) q = q.eq("status", "scheduled").lte("date", publishedBefore);
  const { data, error } = await q;
  if (error) throw new Error(`Puzzle read failed: ${error.message}`);
  return (data ?? []) as unknown as PuzzleRow[];
}

/** Everything in the store, drafts included. For the studio. */
export async function loadLivePuzzles(): Promise<Puzzle[]> {
  return buildAll((await loadRows()).map(rowToInput));
}

/** Scheduled puzzles dated today or earlier. For players. Never ships future puzzles. */
export async function loadPublishedPuzzles(today: string): Promise<Puzzle[]> {
  return buildAll((await loadRows(today)).map(rowToInput));
}

/** Insert or update one puzzle. Throws with a readable message on date conflicts. */
export async function savePuzzle(input: StoredPuzzle): Promise<void> {
  const client = db();
  if (!client) throw new Error(NOT_CONFIGURED);
  const { error } = await client
    .from("puzzles")
    .upsert({ ...inputToRow(input), updated_at: new Date().toISOString() });
  if (error?.code === "23505") throw new Error(`Another puzzle already owns date ${input.date}.`);
  if (error) throw new Error(`Puzzle save failed: ${error.message}`);
}
