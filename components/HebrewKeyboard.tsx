"use client";

/**
 * Compact Hebrew on-screen keyboard for mobile. Letter positions match the
 * standard Israeli (QWERTY-mapped) Hebrew layout, so muscle memory from a
 * physical keyboard transfers directly:
 *
 *   row 1 (E…P):   ק ר א ט ו ן ם פ                  ⌫
 *   row 2 (A…;):   ש ד ג כ ע י ח ל ך ף
 *   row 3 (Z…/):   ז ס ב ה נ מ צ ת ץ                ↵
 *   row 4:         ─────── רווח ───────
 *
 * Final letters (sofiot) live in their canonical positions on the layout —
 * `normalizeHebrew` still folds them when matching, so a player typing כ for
 * a word ending in ך is accepted, but the keyboard doesn't surprise anyone
 * who's used to a Hebrew keyboard.
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
      className="keyboard-key flex-1 disabled:opacity-40"
    >
      {k}
    </button>
  );

  return (
    <div
      dir="rtl"
      className="select-none"
      role="group"
      aria-label="מקלדת עברית"
      aria-disabled={disabled || undefined}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-center gap-[3px]">
          {ROW_1.map(letterBtn)}
          <button
            type="button"
            onClick={onBackspace}
            disabled={disabled}
            aria-label="מחיקה"
            className="keyboard-key is-special flex-[1.4] disabled:opacity-40"
          >
            ⌫
          </button>
        </div>
        <div className="flex justify-center gap-[3px]">{ROW_2.map(letterBtn)}</div>
        <div className="flex justify-center gap-[3px]">
          {ROW_3.map(letterBtn)}
          <button
            type="button"
            onClick={onEnter}
            disabled={disabled}
            aria-label="שליחה"
            className="keyboard-key is-special is-enter flex-[1.4] disabled:opacity-40"
          >
            ↵
          </button>
        </div>
        <button
          type="button"
          onClick={() => onChar(" ")}
          disabled={disabled}
          aria-label="רווח"
          className="keyboard-key is-space disabled:opacity-40"
        >
          רווח
        </button>
      </div>
    </div>
  );
}
