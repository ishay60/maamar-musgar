"use client";

import { useEffect, useState } from "react";
import {
  EVENT_CATEGORY_LABELS,
  type EventCategory,
  type HistoricalEvent,
} from "@/lib/events/types";
import { Empty } from "./shared";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; events: HistoricalEvent[] }
  | { status: "error"; message: string };

export function EventSuggestions({
  date,
  onUseAsContext,
  onUseAsSentence,
}: {
  date: string;
  onUseAsContext: (text: string) => void;
  onUseAsSentence: (text: string) => void;
}) {
  const [state, setState] = useState<FetchState>({ status: "idle" });

  useEffect(() => {
    if (!ISO_DATE.test(date)) {
      setState({ status: "idle" });
      return;
    }
    const ctrl = new AbortController();
    setState({ status: "loading" });
    fetch(`/api/admin/events?date=${encodeURIComponent(date)}`, {
      signal: ctrl.signal,
    })
      .then(async (r) => {
        const payload = (await r.json()) as {
          ok?: boolean;
          events?: HistoricalEvent[];
          error?: string;
        };
        if (!r.ok || !payload.ok) {
          throw new Error(payload.error ?? "טעינה נכשלה");
        }
        setState({ status: "ok", events: payload.events ?? [] });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "טעינה נכשלה",
        });
      });
    return () => ctrl.abort();
  }, [date]);

  if (state.status === "idle") {
    return (
      <Empty text="הזינו תאריך תקין כדי לראות אירועים מוצעים." />
    );
  }
  if (state.status === "loading") {
    return <Empty text="טוען אירועים…" />;
  }
  if (state.status === "error") {
    return (
      <Empty text={`שגיאה: ${state.message}`} tone="error" />
    );
  }
  if (state.events.length === 0) {
    return (
      <Empty text="אין אירועים לתאריך זה." />
    );
  }

  return (
    <ul className="space-y-2">
      {state.events.map((evt) => (
        <li
          key={evt.id}
          className="rounded-md p-3 bg-paper border border-line"
        >
          <div className="flex items-baseline gap-2 flex-wrap">
            <CategoryBadge category={evt.category} />
            {evt.year != null ? (
              <span
                className="puzzle-mono text-[11px] text-muted"
              >
                {evt.year}
              </span>
            ) : null}
            <h4
              className="text-[15px] font-semibold leading-snug font-hebrew"
            >
              {evt.titleHe}
            </h4>
          </div>
          {evt.descriptionHe ? (
            <p
              className="text-[13px] mt-1 leading-relaxed font-hebrew text-stone-700"
            >
              {evt.descriptionHe}
            </p>
          ) : null}
          <div className="flex gap-2 flex-wrap mt-2">
            <button
              type="button"
              onClick={() =>
                onUseAsContext(buildContextText(evt))
              }
              className="px-2.5 py-1 rounded-md puzzle-mono text-[11px] bg-ink text-paper"
            >
              [השתמש כהקשר]
            </button>
            <button
              type="button"
              onClick={() => onUseAsSentence(evt.titleHe)}
              className="px-2.5 py-1 rounded-md puzzle-mono text-[11px] bg-transparent text-ink border border-ink"
            >
              [השתמש כמשפט]
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function buildContextText(evt: HistoricalEvent): string {
  if (evt.descriptionHe && evt.year != null) {
    return `${evt.titleHe} (${evt.year}). ${evt.descriptionHe}`;
  }
  if (evt.descriptionHe) return `${evt.titleHe}. ${evt.descriptionHe}`;
  if (evt.year != null) return `${evt.titleHe} (${evt.year}).`;
  return evt.titleHe;
}

function CategoryBadge({ category }: { category: EventCategory }) {
  const palette: Record<EventCategory, string> = {
    israeli: "bg-blue-100 text-blue-900",
    jewish: "bg-violet-100 text-violet-800",
    world: "bg-red-100 text-red-800",
    culture: "bg-amber-100 text-amber-800",
    science: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span
      className={`puzzle-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded ${palette[category]}`}
    >
      {EVENT_CATEGORY_LABELS[category]}
    </span>
  );
}
