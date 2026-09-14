"use client";

/**
 * Hebrew on-screen keyboard for mobile, a copy of the iPhone Hebrew keyboard
 * so thumbs already know where every letter is. iOS draws it visually
 * left-to-right (ק is the leftmost key), so the rows below are written in
 * screen order and the container is `dir="ltr"`:
 *
 *   row 1:  ק ר א ט ו ן ם פ ⌫        (8 keys + delete on the right)
 *   row 2:  ש ד ג כ ע י ח ל ך ף       (10 keys, full width)
 *   row 3:    ז ס ב ה נ מ צ ת ץ       (9 keys, centered)
 *   row 4:  ─────── רווח ───────  ↵   (space, return on the right)
 *
 * Every letter key is the same fixed width (a tenth of the row), and rows
 * are centered, so nothing drifts.
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
      dir="ltr"
      className="keyboard select-none"
      role="group"
      aria-label="מקלדת עברית"
      aria-disabled={disabled || undefined}
    >
      <div className="keyboard-row">
        {ROW_1.map(letterBtn)}
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
      <div className="keyboard-row">{ROW_2.map(letterBtn)}</div>
      <div className="keyboard-row">{ROW_3.map(letterBtn)}</div>
      <div className="keyboard-row">
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
