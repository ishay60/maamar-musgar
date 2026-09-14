"use client";

import { useEffect, useRef, useState } from "react";
import type { UsePuzzleGame } from "./usePuzzleGame";
import { HebrewKeyboard } from "./HebrewKeyboard";

export function ControlsBar({ game }: { game: UsePuzzleGame }) {
  const activeId = game.game.activeNodeId;
  const canAct = !!game.activeNode && !game.complete;

  const inputRef = useRef<HTMLInputElement>(null);
  const [wrongFlash, setWrongFlash] = useState(false);

  // Keep focus on the input so every keystroke lands here, and re-focus when
  // the active bracket advances. On mobile the input is hidden and focus()
  // is a no-op — taps on the on-screen keyboard drive input directly.
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeId, game.complete]);

  useEffect(() => {
    if (!game.shakeNodeId) return;
    setWrongFlash(true);
    const t = setTimeout(() => setWrongFlash(false), 480);
    return () => clearTimeout(t);
  }, [game.shakeNodeId, game.game.wrongGuesses]);

  const onKeyboardChar = (ch: string) => {
    if (!canAct) return;
    game.setInputValue(game.input + ch);
  };
  const onKeyboardBackspace = () => {
    if (!canAct) return;
    game.setInputValue(game.input.slice(0, -1));
  };
  const onKeyboardEnter = () => {
    if (!canAct) return;
    game.submit();
  };

  return (
    <div className="mt-0 sm:mt-5 space-y-1.5 sm:space-y-2">
      {/* Desktop: text input + enter button. Hidden on mobile — the on-screen
          keyboard below handles input there. */}
      <div className="hidden sm:flex items-stretch gap-2">
        <input
          ref={inputRef}
          type="text"
          dir="auto"
          autoFocus
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={game.input}
          onChange={(e) => game.setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              game.submit();
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              game.setInputValue("");
              return;
            }
          }}
          disabled={!canAct}
          placeholder="הקלידו תשובה…"
          aria-label="תיבת התשובה"
          aria-invalid={wrongFlash || undefined}
          className={
            "flex-1 rounded-md px-4 py-3 puzzle-mono text-[15px] min-h-[46px] outline-none disabled:opacity-50 " +
            (wrongFlash ? "input-wrong" : "")
          }
          style={{
            border: wrongFlash ? "1px solid #f87171" : "1px solid #a5b4fc66",
            backgroundColor: "#ffffff",
            color: "#171412",
          }}
        />
        <button
          type="button"
          onClick={() => {
            game.submit();
            inputRef.current?.focus();
          }}
          disabled={!canAct}
          className="px-4 rounded-md puzzle-mono text-[14px] tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition"
          style={{ backgroundColor: "#171412", color: "#fbfaf4" }}
        >
          [enter]
        </button>
      </div>

      <div className="hidden sm:flex items-center gap-3 flex-wrap">
        <span className="puzzle-mono text-[12px]" style={{ color: "#6b6356" }}>
          אין צורך ללחוץ — פשוט התחילו להקליד. Enter לשליחה · Esc לניקוי · לחיצה על סוגר כחול לעזרה
        </span>
        <div className="flex-1" />
        {wrongFlash ? (
          <span
            className="puzzle-mono text-[11px]"
            style={{ color: "#b91c1c" }}
            role="status"
            aria-live="polite"
          >
            תשובה שגויה
          </span>
        ) : null}
      </div>

      {/* Mobile: a compact typed-so-far display + the Hebrew on-screen keyboard.
          No system input, no separate enter button — keyboard owns it all. */}
      <div className="sm:hidden">
        <div
          dir="auto"
          aria-label="הטקסט שהוקלד"
          className={
            "min-h-[34px] rounded-md px-3 py-1.5 puzzle-mono text-[15px] text-right flex items-center justify-between gap-2 " +
            (wrongFlash ? "input-wrong" : "")
          }
          style={{
            border: wrongFlash ? "1px solid #f87171" : "1px solid #a5b4fc66",
            backgroundColor: "#ffffff",
            color: "#171412",
            opacity: canAct ? 1 : 0.5,
          }}
        >
          <span className="truncate">
            {game.input ? (
              game.input
            ) : (
              <span style={{ color: "#9b9388" }}>הקלידו תשובה…</span>
            )}
          </span>
          {wrongFlash ? (
            <span
              className="puzzle-mono text-[11px] shrink-0"
              style={{ color: "#b91c1c" }}
              role="status"
              aria-live="polite"
            >
              תשובה שגויה
            </span>
          ) : null}
        </div>
        <div className="pt-1.5">
          <HebrewKeyboard
            disabled={!canAct}
            onChar={onKeyboardChar}
            onBackspace={onKeyboardBackspace}
            onEnter={onKeyboardEnter}
          />
        </div>
      </div>
    </div>
  );
}
