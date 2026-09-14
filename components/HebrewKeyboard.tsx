"use client";

/**
 * Hebrew on-screen keyboard for mobile, laid out like the iPhone Hebrew
 * keyboard so thumbs already know where every letter is:
 *
 *   row 1:  ק ר א ט ו ן ם פ            (8 keys, stretched to full width)
 *   row 2:  ש ד ג כ ע י ח ל ך ף        (10 keys)
 *   row 3:  ז ס ב ה נ מ צ ת ץ  ⌫       (9 keys + delete on the left edge)
 *   row 4:  ↵  ─────── רווח ───────    (return on the left edge, like iOS)
 *
 * Every row is a CSS grid spanning the full width, so keys in a row are all
 * the same size and rows line up on both edges instead of drifting.
 *
 * Final letters (sofiot) sit where iOS puts them — `normalizeHebrew` folds
 * them when matching, so כ for a word ending in ך is still accepted.
 */

const ROW_1 = ["ק", "ר", "א", "ט", "ו", "ן", "ם", "פ"];
const ROW_2 = ["ש", "ד", "ג", "כ", "ע", "י", "ח", "ל", "ך", "ף"];
const ROW_3 = ["ז", "ס", "ב", "ה", "נ", "מ", "צ", "ת", "ץ"];

interface Props {
  disabled?: boolean;
  onChar: (ch: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
}

export function HebrewKeyboard({ disabled, onChar, onBackspace, onEnter }: Props) {
  const letterBtn = (k: string) => (
    <button
      key={k}
      type="button"
      onClick={() => onChar(k)}
      disabled={disabled}
      aria-label={k}
      className="keyboard-key"
    >
      {k}
    </button>
  );

  return (
    <div
      dir="rtl"
      className="keyboard select-none"
      role="group"
      aria-label="מקלדת עברית"
      aria-disabled={disabled || undefined}
    >
      <div className="keyboard-row keyboard-row-1">{ROW_1.map(letterBtn)}</div>
      <div className="keyboard-row keyboard-row-2">{ROW_2.map(letterBtn)}</div>
      <div className="keyboard-row keyboard-row-3">
        {ROW_3.map(letterBtn)}
        <button
          type="button"
          onClick={onBackspace}
          disabled={disabled}
          aria-label="מחיקה"
          className="keyboard-key is-special is-backspace"
        >
          ⌫
        </button>
      </div>
      <div className="keyboard-row keyboard-row-4">
        <button
          type="button"
          onClick={() => onChar(" ")}
          disabled={disabled}
          aria-label="רווח"
          className="keyboard-key is-space"
        >
          רווח
        </button>
        <button
          type="button"
          onClick={onEnter}
          disabled={disabled}
          aria-label="שליחה"
          className="keyboard-key is-special is-enter"
        >
          ↵
        </button>
      </div>
    </div>
  );
}
