import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminAuthed, isAdminEnabled } from "@/lib/adminAccess";
import { syncClues } from "@/lib/clueLibrary";
import { savePuzzle } from "@/lib/puzzleStore";
import type { PuzzleStatus, StoredPuzzle } from "@/lib/puzzleStore";
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
  let input: StoredPuzzle;
  try {
    const body = await request.json();
    input = parseBuildPuzzleInput(body);
    buildPuzzle(input);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Invalid puzzle payload." },
      { status: 400 },
    );
  }

  try {
    await savePuzzle(input);
    // The library is a convenience index; never let it fail a save.
    await syncClues(input).catch((e) => console.error(e));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed.";
    return NextResponse.json({ ok: false, error: message }, { status: message.includes("already owns") ? 409 : 502 });
  }
  return NextResponse.json({ ok: true, id: input.id, date: input.date, status: input.status });
}

function parseBuildPuzzleInput(value: unknown): StoredPuzzle {
  if (!isRecord(value)) throw new Error("Puzzle payload must be an object.");
  const id = requiredString(value.id, "id");
  const date = requiredString(value.date, "date");
  const bracketString = requiredString(value.bracketString, "bracketString");
  const finalSentence = requiredString(value.finalSentence, "finalSentence");
  const specs = parseSpecs(value.specs);

  return {
    id,
    date,
    status: parseStatus(value.status),
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
    };
  });
}

function parseStatus(value: unknown): PuzzleStatus {
  if (value == null || value === "scheduled") return "scheduled";
  if (value === "draft") return "draft";
  throw new Error("status is invalid.");
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
