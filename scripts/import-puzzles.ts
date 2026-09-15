// One-shot: load data/puzzles.json into the puzzles table.
//   node --env-file=.env scripts/import-puzzles.ts [path/to/puzzles.json]
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const file = process.argv[2] ?? "data/puzzles.json";
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");

type Input = {
  id: string; date: string; bracketString: string; specs: unknown; finalSentence: string;
  historicalContext?: string; maxScore?: number; tags?: string[]; difficulty?: string;
};
const inputs = JSON.parse(await readFile(file, "utf8")) as Input[];
const rows = inputs.map((p) => ({
  id: p.id,
  date: p.date,
  status: "scheduled",
  bracket_string: p.bracketString,
  specs: p.specs,
  final_sentence: p.finalSentence,
  historical_context: p.historicalContext ?? null,
  max_score: p.maxScore ?? null,
  tags: p.tags ?? [],
  difficulty: p.difficulty ?? null,
  updated_by: "import",
}));

const { error } = await createClient(url, key).from("puzzles").upsert(rows);
if (error) throw new Error(error.message);
console.log(`imported ${rows.length} puzzles from ${file}`);
