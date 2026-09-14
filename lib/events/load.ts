import { readFile } from "node:fs/promises";
import path from "node:path";
import { EVENT_CATEGORY_LABELS } from "./types";
import type { HistoricalEvent, EventCategory } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "historical-events.json");

const ISO_DATE = /^\d{4}-(\d{2})-(\d{2})$/;
const MONTH_DAY = /^(\d{2})-(\d{2})$/;

export function monthDayFromIso(iso: string): string | null {
  const m = ISO_DATE.exec(iso);
  if (!m) return null;
  return `${m[1]}-${m[2]}`;
}

async function loadAllEvents(): Promise<HistoricalEvent[]> {
  const raw = await readFile(DATA_FILE, "utf8").catch(() => "[]");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.filter(isHistoricalEvent) : [];
}

export async function loadEventsForDate(iso: string): Promise<HistoricalEvent[]> {
  const md = monthDayFromIso(iso);
  if (!md) return [];
  const all = await loadAllEvents();
  return all
    .filter((e) => e.monthDay === md)
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
}

function isHistoricalEvent(value: unknown): value is HistoricalEvent {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.monthDay === "string" &&
    MONTH_DAY.test(v.monthDay) &&
    typeof v.titleHe === "string" &&
    typeof v.category === "string" &&
    isCategory(v.category)
  );
}

function isCategory(s: string): s is EventCategory {
  return Object.hasOwn(EVENT_CATEGORY_LABELS, s);
}
