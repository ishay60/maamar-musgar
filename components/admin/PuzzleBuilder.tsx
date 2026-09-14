"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildPuzzle,
  parseBracketString,
  puzzleToBuildInput,
  validatePuzzleAuthoring,
} from "@/lib/puzzle";
import type { BracketSpec, BuildPuzzleInput, Difficulty, Puzzle } from "@/lib/puzzle";
import { DIFFICULTY_EMOJI, DIFFICULTY_LABEL_HE } from "@/lib/puzzle";
import { AnswersTable, emptyAnswerRow } from "./AnswersTable";
import type { AnswerRow } from "./AnswersTable";
import { EventSuggestions } from "./EventSuggestions";
import { GameContainerPreview } from "./GameContainerPreview";
import { TreeView } from "./TreeView";
import { shiftDay } from "@/lib/calendar";
import { todayInIsrael } from "@/lib/puzzle/puzzles";

export function PuzzleBuilder({
  initialDate,
  initialPuzzle,
}: {
  initialDate?: string;
  initialPuzzle?: Puzzle;
} = {}) {
  const seed = initialPuzzle ? puzzleToSeed(initialPuzzle) : null;
  const editingId = initialPuzzle?.id ?? null;

  const [date, setDate] = useState(seed?.date ?? initialDate ?? todayInIsrael());
  const [finalSentence, setFinalSentence] = useState(seed?.finalSentence ?? "");
  const [historicalContext, setHistoricalContext] = useState(seed?.historicalContext ?? "");
  const tags = initialPuzzle?.tags;
  const maxScore = initialPuzzle?.maxScore;
  const [difficulty, setDifficulty] = useState<Difficulty | "">(
    initialPuzzle?.difficulty ?? "",
  );
  const [bracketString, setBracketString] = useState(seed?.bracketString ?? "");
  const [rows, setRows] = useState<AnswerRow[]>(seed?.rows ?? []);

  const parsed = useMemo(() => {
    try {
      return parseBracketString(bracketString);
    } catch {
      return null;
    }
  }, [bracketString]);

  // Keep the rows array length in sync with the parsed bracket count.
  useEffect(() => {
    const target = parsed?.bracketOrder.length ?? 0;
    if (rows.length === target) return;
    setRows((prev) => {
      if (prev.length === target) return prev;
      if (prev.length < target) {
        return [...prev, ...Array.from({ length: target - prev.length }, emptyAnswerRow)];
      }
      return prev.slice(0, target);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed]);

  const answers = useMemo(() => rows.map((r) => r.answer), [rows]);

  const specs: BracketSpec[] = useMemo(
    () =>
      rows.map((r) => ({
        answer: r.answer,
        acceptedAnswers: r.accepted
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
        difficulty: r.difficulty || undefined,
        clueType: r.clueType || undefined,
      })),
    [rows],
  );

  const validation = useMemo(
    () => validatePuzzleAuthoring({ bracketString, answers, finalSentence }),
    [bracketString, answers, finalSentence],
  );

  const buildInput = useMemo<BuildPuzzleInput>(
    () => ({
      id: editingId ?? `he-${date}`,
      date,
      finalSentence,
      historicalContext,
      bracketString,
      specs,
      tags,
      maxScore,
      difficulty: difficulty || undefined,
    }),
    [
      editingId,
      date,
      finalSentence,
      historicalContext,
      bracketString,
      specs,
      tags,
      maxScore,
      difficulty,
    ],
  );

  const builtPuzzle: Puzzle | null = useMemo(() => {
    if (!validation.ok) return null;
    try {
      return buildPuzzle(buildInput);
    } catch {
      return null;
    }
  }, [validation.ok, buildInput]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <header className="flex items-baseline justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: '"David Libre", serif' }}
          >
            מאמר מוסגר · סטודיו החידות
          </h1>
          <p className="puzzle-mono text-[12px] mt-1" style={{ color: "#6b6356" }}>
            {editingId ? `עריכה · ${editingId}` : "חידה חדשה"}
          </p>
        </div>
        <nav className="puzzle-mono text-[13px] flex items-center gap-3" style={{ color: "#6b6356" }}>
          <Link href={`/admin/calendar?month=${date.slice(0, 7)}`} className="underline-offset-4 hover:underline">
            לוח שנה →
          </Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/admin/archive" className="underline-offset-4 hover:underline">
            ארכיון →
          </Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/" className="underline-offset-4 hover:underline">
            ← חזרה לחידה
          </Link>
        </nav>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <section className="space-y-4">
          <Card title="מטא־דאטה">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="תאריך (ISO)">
                <div className="flex items-center gap-2">
                  <DayLink iso={shiftDay(date, -1)} label="◀ יום קודם" />
                  <TextInput value={date} onChange={setDate} className="puzzle-mono" />
                  <DayLink iso={shiftDay(date, 1)} label="יום הבא ▶" />
                </div>
              </Field>
              <Field label="רמת קושי של החידה">
                <DifficultySelect value={difficulty} onChange={setDifficulty} />
              </Field>
            </div>
          </Card>

          <Card title="אירועים היסטוריים בתאריך זה">
            <EventSuggestions
              date={date}
              onUseAsContext={setHistoricalContext}
              onUseAsSentence={setFinalSentence}
            />
          </Card>

          <Card title="המשפט הסופי">
            <TextArea
              value={finalSentence}
              onChange={setFinalSentence}
              rows={2}
              placeholder="המשפט המלא שייחשף בסוף"
            />
          </Card>

          <Card title="מחרוזת הסוגריים (הסתרות וקינון)">
            <TextArea
              value={bracketString}
              onChange={setBracketString}
              rows={5}
              mono
              placeholder="כתבו את המשפט עם סוגרי רמז. לדוגמה: [מלך ישראל] המלך [פועל] ב[עיר]"
            />
            <div className="puzzle-mono text-[11px] mt-1" style={{ color: "#6b6356" }}>
              {validation.bracketCount} סוגרים (לפי סדר הופעה)
            </div>
          </Card>

          <Card title="תשובות וקושי (לפי סדר הופעה)">
            <AnswersTable
              brackets={parsed?.bracketOrder ?? []}
              rows={rows}
              onChange={setRows}
            />
          </Card>

          <Card title="הקשר היסטורי (אופציונלי)">
            <TextArea
              value={historicalContext}
              onChange={setHistoricalContext}
              rows={3}
            />
          </Card>

          <ValidationPanel validation={validation} />

          <ExportPanel puzzle={builtPuzzle} buildInput={buildInput} />
        </section>

        <aside className="space-y-4">
          <Card title="עץ הפירוק">
            <TreeView tree={parsed?.tree ?? null} answers={answers} />
          </Card>
          <Card title="תצוגה מקדימה (אינטראקטיבית)">
            {builtPuzzle ? (
              <GameContainerPreview puzzle={builtPuzzle} />
            ) : (
              <div
                className="puzzle-mono text-[12px] text-center py-6"
                style={{ color: "#9ca3af" }}
              >
                תקנו את השגיאות מטה כדי לצפות בתצוגה החיה
              </div>
            )}
          </Card>
        </aside>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-xl p-4"
      style={{ backgroundColor: "#ffffff", border: "1px solid #e7e0d0" }}
    >
      <div
        className="puzzle-mono text-[11px] tracking-wider uppercase mb-2"
        style={{ color: "#6b6356" }}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div
        className="puzzle-mono text-[11px] mb-1"
        style={{ color: "#6b6356" }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <input
      type="text"
      dir="auto"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-md px-3 py-2 text-[14px] ${className}`}
      style={{ border: "1px solid #e7e0d0", backgroundColor: "#fbfaf4" }}
    />
  );
}

function DifficultySelect({
  value,
  onChange,
}: {
  value: Difficulty | "";
  onChange: (next: Difficulty | "") => void;
}) {
  const options: Difficulty[] = ["easy", "medium", "hard"];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Difficulty | "")}
      className="w-full rounded-md px-3 py-2 text-[14px] puzzle-mono"
      style={{ border: "1px solid #e7e0d0", backgroundColor: "#fbfaf4" }}
      aria-label="רמת קושי של החידה"
    >
      <option value="">— ללא דירוג —</option>
      {options.map((d) => (
        <option key={d} value={d}>
          {DIFFICULTY_EMOJI[d]} {DIFFICULTY_LABEL_HE[d]}
        </option>
      ))}
    </select>
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
  mono = false,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <textarea
      dir="auto"
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-md px-3 py-2 text-[14px] ${mono ? "puzzle-mono" : ""}`}
      style={{
        border: "1px solid #e7e0d0",
        backgroundColor: "#fbfaf4",
        fontFamily: mono
          ? '"IBM Plex Mono", monospace'
          : '"David Libre", serif',
        lineHeight: 1.55,
      }}
    />
  );
}

function ValidationPanel({ validation }: { validation: ReturnType<typeof validatePuzzleAuthoring> }) {
  const errors = validation.issues.filter((i) => i.severity === "error");
  const warnings = validation.issues.filter((i) => i.severity === "warning");
  const statusColor = validation.ok ? "#047857" : errors.length > 0 ? "#b91c1c" : "#b45309";
  return (
    <section
      className="rounded-xl p-4"
      style={{
        backgroundColor: validation.ok ? "#ecfdf5" : "#fffbeb",
        border: `1px solid ${validation.ok ? "#86efac" : "#fde68a"}`,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="puzzle-mono text-[11px] tracking-wider uppercase"
          style={{ color: statusColor }}
        >
          {validation.ok ? "✓ תקין — מוכן לפרסום" : `✕ ${errors.length} שגיאות, ${warnings.length} אזהרות`}
        </div>
        <div className="puzzle-mono text-[11px]" style={{ color: "#6b6356" }}>
          סוגרים: {validation.bracketCount}
        </div>
      </div>
      {validation.issues.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {validation.issues.map((i, idx) => (
            <li
              key={idx}
              className="puzzle-mono text-[12px] whitespace-pre-wrap"
              style={{
                color: i.severity === "error" ? "#991b1b" : "#92400e",
              }}
            >
              <span style={{ fontWeight: 700 }}>
                {i.severity === "error" ? "שגיאה" : "אזהרה"}
              </span>{" "}
              [{i.code}] {i.message}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ExportPanel({
  puzzle,
  buildInput,
}: {
  puzzle: Puzzle | null;
  buildInput: BuildPuzzleInput;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<
    | { status: "idle" }
    | { status: "saving" }
    | { status: "saved"; message: string }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const json = puzzle ? JSON.stringify(buildInput, null, 2) : "// תקנו שגיאות לפני ייצוא";

  useEffect(() => {
    setSaveState({ status: "idle" });
  }, [buildInput]);

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* ignore */
    }
  };

  const save = async () => {
    if (!puzzle) return;
    setSaveState({ status: "saving" });
    try {
      const response = await fetch("/api/admin/puzzles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildInput),
      });
      const text = await response.text();
      let payload: { ok?: boolean; error?: string; path?: string } = {};
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error(`השרת החזיר ${response.status} ללא JSON: ${text.slice(0, 200) || "(ריק)"}`);
      }
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? `שמירה נכשלה (${response.status})`);
      }
      setSaveState({ status: "saved", message: `נשמר אל ${payload.path ?? "data/puzzles.json"}` });
    } catch (error) {
      setSaveState({
        status: "error",
        message: error instanceof Error ? error.message : "שמירה נכשלה",
      });
    }
  };

  return (
    <section
      className="rounded-xl p-4"
      style={{ backgroundColor: "#ffffff", border: "1px solid #e7e0d0" }}
    >
      <div
        className="puzzle-mono text-[11px] tracking-wider uppercase mb-2"
        style={{ color: "#6b6356" }}
      >
        ייצוא
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={save}
          disabled={!puzzle || saveState.status === "saving"}
          className="px-3 py-1.5 rounded-md puzzle-mono text-[12px] disabled:opacity-40"
          style={{ backgroundColor: "#047857", color: "#ecfdf5" }}
        >
          {saveState.status === "saving" ? "שומר..." : "[שמירה]"}
        </button>
        <button
          type="button"
          onClick={() => copy("json", json)}
          disabled={!puzzle}
          className="px-3 py-1.5 rounded-md puzzle-mono text-[12px] disabled:opacity-40"
          style={{ backgroundColor: "#171412", color: "#fbfaf4" }}
        >
          {copied === "json" ? "✓ הועתק" : "[העתקת JSON]"}
        </button>
      </div>
      {saveState.status === "saved" || saveState.status === "error" ? (
        <div
          className="puzzle-mono text-[12px] mt-2"
          style={{ color: saveState.status === "saved" ? "#047857" : "#b91c1c" }}
        >
          {saveState.message}
        </div>
      ) : null}
      <pre
        className="mt-3 rounded-md p-3 puzzle-mono text-[11px] overflow-auto max-h-64"
        style={{ backgroundColor: "#fbfaf4", border: "1px solid #e7e0d0", lineHeight: 1.5 }}
        dir="ltr"
      >
        {json}
      </pre>
    </section>
  );
}

/** Jump the studio to another day's puzzle (or an empty builder for that day). */
function DayLink({ iso, label }: { iso: string; label: string }) {
  return (
    <Link
      href={`/admin?date=${iso}`}
      className="puzzle-mono text-[11px] whitespace-nowrap underline-offset-4 hover:underline"
      style={{ color: "#6b6356" }}
      title={iso}
    >
      {label}
    </Link>
  );
}

function puzzleToSeed(puzzle: Puzzle) {
  const input = puzzleToBuildInput(puzzle);
  return {
    date: input.date,
    finalSentence: input.finalSentence,
    historicalContext: input.historicalContext ?? "",
    bracketString: input.bracketString,
    rows: input.specs.map<AnswerRow>((s) => ({
      answer: s.answer,
      accepted: (s.acceptedAnswers ?? []).join(", "),
      difficulty: (s.difficulty ?? "") as AnswerRow["difficulty"],
      clueType: (s.clueType ?? "") as AnswerRow["clueType"],
    })),
  };
}
