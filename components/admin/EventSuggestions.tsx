"use client";

import { useEffect, useState } from "react";
import {
  EVENT_CATEGORY_LABELS,
  type EventCategory,
  type HistoricalEvent,
} from "@/lib/events/types";

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
      <Empty text="אין אירועים בארכיון לתאריך זה. אפשר להוסיף ידנית ל-data/historical-events.json." />
    );
  }

  return (
    <ul className="space-y-2">
      {state.events.map((evt) => (
        <li
          key={evt.id}
          className="rounded-md p-3"
          style={{ backgroundColor: "#fbfaf4", border: "1px solid #e7e0d0" }}
        >
          <div className="flex items-baseline gap-2 flex-wrap">
            <CategoryBadge category={evt.category} />
            {evt.year != null ? (
              <span
                className="puzzle-mono text-[11px]"
                style={{ color: "#6b6356" }}
              >
                {evt.year}
              </span>
            ) : null}
            <h4
              className="text-[15px] font-semibold leading-snug"
              style={{ fontFamily: '"David Libre", serif' }}
            >
              {evt.titleHe}
            </h4>
          </div>
          {evt.descriptionHe ? (
            <p
              className="text-[13px] mt-1 leading-relaxed"
              style={{
                fontFamily: '"David Libre", serif',
                color: "#3f3a32",
              }}
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
              className="px-2.5 py-1 rounded-md puzzle-mono text-[11px]"
              style={{ backgroundColor: "#171412", color: "#fbfaf4" }}
            >
              [השתמש כהקשר]
            </button>
            <button
              type="button"
              onClick={() => onUseAsSentence(evt.titleHe)}
              className="px-2.5 py-1 rounded-md puzzle-mono text-[11px]"
              style={{
                backgroundColor: "transparent",
                color: "#171412",
                border: "1px solid #171412",
              }}
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
  const palette: Record<EventCategory, { bg: string; fg: string }> = {
    israeli: { bg: "#dbeafe", fg: "#1e3a8a" },
    jewish: { bg: "#ede9fe", fg: "#5b21b6" },
    world: { bg: "#fee2e2", fg: "#991b1b" },
    culture: { bg: "#fef3c7", fg: "#92400e" },
    science: { bg: "#d1fae5", fg: "#065f46" },
  };
  const { bg, fg } = palette[category];
  return (
    <span
      className="puzzle-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded"
      style={{ backgroundColor: bg, color: fg }}
    >
      {EVENT_CATEGORY_LABELS[category]}
    </span>
  );
}

function Empty({
  text,
  tone = "muted",
}: {
  text: string;
  tone?: "muted" | "error";
}) {
  return (
    <div
      className="puzzle-mono text-[12px] text-center py-4"
      style={{ color: tone === "error" ? "#b91c1c" : "#9ca3af" }}
    >
      {text}
    </div>
  );
}
