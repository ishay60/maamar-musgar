import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminAuthed, isAdminEnabled } from "@/lib/adminAccess";
import { puzzleStore } from "@/lib/puzzleStore";
import type { PuzzleStore } from "@/lib/puzzleStore";
import { buildPuzzle } from "@/lib/puzzle/build";
import type { BuildPuzzleInput } from "@/lib/puzzle/build";
import type { ClueType, Difficulty } from "@/lib/puzzle/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  if (!isAdminAuthed(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  const store = puzzleStore();
  if (!store) {
    return NextResponse.json(
      { ok: false, error: "No puzzle store configured (set GITHUB_TOKEN and GITHUB_REPO)." },
      { status: 503 },
    );
  }

  let input: BuildPuzzleInput;
  try {
    const body = await request.json();
    input = parseBuildPuzzleInput(body);
    buildPuzzle(input);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid puzzle payload.",
      },
      { status: 400 },
    );
  }

  let saved: BuildPuzzleInput[];
  try {
    saved = await readSavedPuzzleInputs(store);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not read puzzle store." },
      { status: 502 },
    );
  }
  if (saved.some((p) => p.id !== input.id && p.date === input.date)) {
    return NextResponse.json(
      { ok: false, error: `Another puzzle already owns date ${input.date}.` },
      { status: 409 },
    );
  }
  const idx = saved.findIndex((p) => p.id === input.id);
  const next = saved.slice();
  if (idx >= 0) {
    next[idx] = input;
  } else {
    next.push(input);
  }
  next.sort((a, b) => a.date.localeCompare(b.date));

  let location: string;
  try {
    ({ location } = await store.write(
      `${JSON.stringify(next, null, 2)}\n`,
      `puzzle: ${idx >= 0 ? "update" : "add"} ${input.id} (${input.date})`,
    ));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Save failed." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, id: input.id, date: input.date, count: next.length, path: location });
}

async function readSavedPuzzleInputs(store: PuzzleStore): Promise<BuildPuzzleInput[]> {
  const raw = await store.read();
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.map(parseBuildPuzzleInput) : [];
}

function parseBuildPuzzleInput(value: unknown): BuildPuzzleInput {
  if (!isRecord(value)) throw new Error("Puzzle payload must be an object.");
  const id = requiredString(value.id, "id");
  const date = requiredString(value.date, "date");
  const title = requiredString(value.title, "title");
  const bracketString = requiredString(value.bracketString, "bracketString");
  const finalSentence = requiredString(value.finalSentence, "finalSentence");
  const specs = parseSpecs(value.specs);

  return {
    id,
    date,
    title,
    bracketString,
    specs,
    finalSentence,
    historicalContext:
      typeof value.historicalContext === "string" ? value.historicalContext : undefined,
    maxScore: typeof value.maxScore === "number" ? value.maxScore : undefined,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
    difficulty: parseDifficulty(value.difficulty),
  };
}

function parseSpecs(value: unknown): BuildPuzzleInput["specs"] {
  if (!Array.isArray(value)) throw new Error("specs must be an array.");
  return value.map((spec, idx) => {
    if (!isRecord(spec)) throw new Error(`specs[${idx}] must be an object.`);
    return {
      answer: requiredString(spec.answer, `specs[${idx}].answer`),
      acceptedAnswers: Array.isArray(spec.acceptedAnswers)
        ? spec.acceptedAnswers.filter((a): a is string => typeof a === "string")
        : undefined,
      clueType: parseClueType(spec.clueType, `specs[${idx}].clueType`),
      difficulty: parseDifficulty(spec.difficulty, `specs[${idx}].difficulty`),
      hint: typeof spec.hint === "string" ? spec.hint : undefined,
    };
  });
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const CLUE_TYPES: ClueType[] = ["definition", "fill-blank", "trivia", "wordplay", "association"];

function parseDifficulty(value: unknown, field = "difficulty"): Difficulty | undefined {
  if (value == null || value === "") return undefined;
  if (!DIFFICULTIES.includes(value as Difficulty)) throw new Error(`${field} is invalid.`);
  return value as Difficulty;
}

function parseClueType(value: unknown, field: string): ClueType | undefined {
  if (value == null || value === "") return undefined;
  if (!CLUE_TYPES.includes(value as ClueType)) throw new Error(`${field} is invalid.`);
  return value as ClueType;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
