import type { PuzzleNode } from "./types";
import { parseBracketString, reconstructSentence } from "./parser";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  bracketCount: number;
  issues: ValidationIssue[];
}

export interface ValidateInput {
  bracketString: string;
  answers: string[];
  finalSentence: string;
}

/**
 * Full-structural validation for the authoring surface.
 */
export function validatePuzzleAuthoring(input: ValidateInput): ValidationResult {
  const issues: ValidationIssue[] = [];
  const { bracketString, answers, finalSentence } = input;
  const minBrackets = 3;

  if (!bracketString.trim()) {
    issues.push({ severity: "error", code: "empty-string", message: "ציינו את מחרוזת הסוגריים" });
    return { ok: false, bracketCount: 0, issues };
  }

  let tree: PuzzleNode | undefined;
  let bracketOrder: PuzzleNode[] | undefined;
  try {
    const parsed = parseBracketString(bracketString);
    tree = parsed.tree;
    bracketOrder = parsed.bracketOrder;
  } catch (e) {
    issues.push({
      severity: "error",
      code: "parse-error",
      message: e instanceof Error ? e.message : "שגיאת פירוק בסוגריים",
    });
    return { ok: false, bracketCount: 0, issues };
  }

  bracketOrder.forEach((node, idx) => {
    const hasChildren = (node.children ?? []).length > 0;
    if (!hasChildren) {
      issues.push({
        severity: "error",
        code: "empty-bracket",
        message: `סוגר #${idx + 1} ריק — חייב להכיל טקסט או סוגרי משנה`,
      });
    }
  });

  if (bracketOrder.length < minBrackets) {
    issues.push({
      severity: "warning",
      code: "too-few-brackets",
      message: `מומלץ לפחות ${minBrackets} סוגרים; נמצאו ${bracketOrder.length}`,
    });
  }

  if (answers.length !== bracketOrder.length) {
    issues.push({
      severity: "error",
      code: "answer-count-mismatch",
      message: `מספר התשובות (${answers.length}) לא תואם למספר הסוגרים (${bracketOrder.length})`,
    });
  } else {
    answers.forEach((a, idx) => {
      if (!a || !a.trim()) {
        issues.push({
          severity: "error",
          code: "missing-answer",
          message: `חסרה תשובה לסוגר #${idx + 1}`,
        });
      }
    });
  }

  // Try reconstruction only if counts align and no missing answers
  if (
    answers.length === bracketOrder.length &&
    answers.every((a) => !!a.trim()) &&
    tree
  ) {
    bracketOrder.forEach((node, idx) => {
      node.answer = answers[idx];
    });
    const got = reconstructSentence(tree).replace(/\s+/g, " ").trim();
    const want = finalSentence.replace(/\s+/g, " ").trim();
    if (got !== want) {
      issues.push({
        severity: "error",
        code: "reconstruction-mismatch",
        message: `השחזור מהסוגרים אינו תואם למשפט הסופי.\n  רצוי: "${want}"\n  יצא:  "${got}"`,
      });
    }
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  return {
    ok: errorCount === 0,
    bracketCount: bracketOrder.length,
    issues,
  };
}

