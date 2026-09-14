"use client";

import { useEffect, useState } from "react";
import type { PuzzleNode } from "@/lib/puzzle";
import { isNodeSolvable } from "@/lib/puzzle";
import type { UsePuzzleGame } from "./usePuzzleGame";

interface Props {
  tree: PuzzleNode;
  game: UsePuzzleGame;
}

/**
 * Design reference: docs/design-research.md.
 * Core rule: locked brackets render as plain inline `[` `]` characters in the
 * prose. Only solvable leaves get the periwinkle fill. Solved brackets
 * disappear entirely.
 */
export function PuzzleBoard({ tree, game }: Props) {
  const [helpPrompt, setHelpPrompt] = useState<{
    kind: "peek" | "reveal";
    node: PuzzleNode;
  } | null>(null);

  const focusInput = () => {
    setTimeout(() => {
      document.querySelector<HTMLInputElement>('input[aria-label="תיבת התשובה"]')?.focus();
    }, 0);
  };

  const closeHelpPrompt = () => {
    setHelpPrompt(null);
    focusInput();
  };

  const requestHelp = (node: PuzzleNode) => {
    game.setActive(node.id);
    setHelpPrompt({
      kind: game.game.peeks.has(node.id) ? "reveal" : "peek",
      node,
    });
  };

  const confirmHelp = () => {
    if (!helpPrompt) return;
    if (helpPrompt.kind === "peek") {
      game.peekNode(helpPrompt.node.id);
    } else {
      game.revealNode(helpPrompt.node.id);
    }
    setHelpPrompt(null);
    focusInput();
  };

  useEffect(() => {
    if (!helpPrompt) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeHelpPrompt();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helpPrompt]);

  useEffect(() => {
    if (!helpPrompt) return;
    if (game.complete || game.game.solved.has(helpPrompt.node.id)) {
      setHelpPrompt(null);
    }
  }, [game.complete, game.game.solved, helpPrompt]);

  return (
    <div
      className="font-hebrew text-[17px] sm:text-[21px] leading-[1.7] sm:leading-[1.9] text-[#171412]"
      style={{ fontFamily: '"David Libre", "Frank Ruhl Libre", "Times New Roman", serif' }}
    >
      <div className="whitespace-normal break-words">
        {tree.children?.map((n) => (
          <NodeView
            key={n.id}
            node={n}
            game={game}
            onHelpRequest={requestHelp}
            highlightActive={!!helpPrompt}
          />
        ))}
      </div>
      {helpPrompt ? (
        <HelpConfirmDialog
          kind={helpPrompt.kind}
          node={helpPrompt.node}
          solved={game.game.solved}
          onClose={closeHelpPrompt}
          onConfirm={confirmHelp}
        />
      ) : null}
    </div>
  );
}

function NodeView({
  node,
  game,
  onHelpRequest,
  highlightActive,
}: {
  node: PuzzleNode;
  game: UsePuzzleGame;
  onHelpRequest: (node: PuzzleNode) => void;
  highlightActive: boolean;
}) {
  if (node.type === "text") return <TextRun content={node.content ?? ""} />;
  if (node.type === "bracket") {
    return (
      <BracketView
        node={node}
        game={game}
        onHelpRequest={onHelpRequest}
        highlightActive={highlightActive}
      />
    );
  }
  return null;
}

/** Hebrew letters in serif; Latin + digits rendered monospace for typewriter feel. */
function TextRun({ content }: { content: string }) {
  const parts: { kind: "he" | "mono"; text: string }[] = [];
  let cur: { kind: "he" | "mono"; text: string } | null = null;
  for (const ch of content) {
    const isLatinOrDigit = /[A-Za-z0-9]/.test(ch);
    const kind: "he" | "mono" = isLatinOrDigit ? "mono" : "he";
    if (!cur || cur.kind !== kind) {
      cur = { kind, text: ch };
      parts.push(cur);
    } else {
      cur.text += ch;
    }
  }
  return (
    <>
      {parts.map((p, i) =>
        p.kind === "mono" ? (
          <span key={i} className="puzzle-mono text-[0.92em]">
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

function BracketView({
  node,
  game,
  onHelpRequest,
  highlightActive,
}: {
  node: PuzzleNode;
  game: UsePuzzleGame;
  onHelpRequest: (node: PuzzleNode) => void;
  highlightActive: boolean;
}) {
  const { game: state, popNodeId, shakeNodeId } = game;
  const solved = state.solved.has(node.id);
  const solvable = isNodeSolvable(node, state.solved);
  const active = highlightActive && state.activeNodeId === node.id;
  const peeked = state.peeks.has(node.id);
  const revealed = state.reveals.has(node.id);
  const justSolved = popNodeId === node.id;
  const shaking = shakeNodeId === node.id;

  if (solved) {
    const flashClass = justSolved ? "just-solved" : "";
    return (
      <span
        className={`inline ${flashClass}`.trim()}
        aria-label={revealed ? `נחשף: ${node.answer}` : `נפתר: ${node.answer}`}
      >
        {revealed ? (
          <span className="underline decoration-dotted decoration-rose-400/70 underline-offset-2">
            <TextRun content={node.answer ?? ""} />
          </span>
        ) : (
          <TextRun content={node.answer ?? ""} />
        )}
      </span>
    );
  }

  if (solvable) {
    const commonStyle = active
      ? {
          backgroundColor: "#a5b4fc",
          color: "#1e1b4b",
          fontFamily: "inherit",
          fontSize: "inherit",
          boxShadow: "0 0 0 2px #6366f1, inset 0 0 0 1px rgba(30, 27, 75, 0.18)",
        }
      : {
          backgroundColor: "#c7d2fe",
          color: "#1e1b4b",
          fontFamily: "inherit",
          fontSize: "inherit",
          boxShadow: "inset 0 0 0 1px rgba(30, 27, 75, 0.12)",
        };
    return (
      <button
        type="button"
        onClick={() => onHelpRequest(node)}
        className={
          "bracket-leaf cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] " +
          (shaking ? "animate-shake" : "")
        }
        style={commonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#a5b4fc";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = active ? "#a5b4fc" : "#c7d2fe";
        }}
        aria-current={active ? "true" : undefined}
        aria-label={`סוגר פתיר — ${peeked ? "לחצו לחשיפה" : "לחצו לרמז"}${peeked ? " (הוצץ)" : ""}.`}
      >
        <span aria-hidden style={{ opacity: 0.65 }}>[</span>
        <span>{peeked ? renderPeek(node, state.solved) : renderLeafClue(node, state.solved)}</span>
        <span aria-hidden style={{ opacity: 0.65 }}>]</span>
      </button>
    );
  }

  // LOCKED — plain inline `[` `]` as part of the prose
  return (
    <span role="group" aria-label="סוגר נעול — השלימו את הסוגרים שבפנים">
      <span>[</span>
      {(node.children ?? []).map((c) => (
        <NodeView
          key={c.id}
          node={c}
          game={game}
          onHelpRequest={onHelpRequest}
          highlightActive={highlightActive}
        />
      ))}
      <span>]</span>
    </span>
  );
}

function HelpConfirmDialog({
  kind,
  node,
  solved,
  onClose,
  onConfirm,
}: {
  kind: "peek" | "reveal";
  node: PuzzleNode;
  solved: Set<string>;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isPeek = kind === "peek";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(23, 20, 18, 0.45)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isPeek ? "אישור רמז" : "אישור חשיפה"}
    >
      <div
        className="w-full max-w-sm rounded-xl p-5 text-right"
        style={{ backgroundColor: "#fbfaf4", border: "1px solid #e7e0d0" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="puzzle-mono text-[12px] tracking-wider uppercase"
          style={{ color: isPeek ? "#b45309" : "#b91c1c" }}
        >
          {isPeek ? "peek −5" : "reveal −20"}
        </div>
        <h2 className="text-xl font-bold mt-1" style={{ fontFamily: '"David Libre", serif' }}>
          {isPeek ? "לקבל רמז לסוגר הזה?" : "לחשוף את התשובה?"}
        </h2>
        <div
          className="mt-3 rounded-md px-3 py-2 text-[15px] leading-relaxed"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e7e0d0",
            fontFamily: '"David Libre", serif',
          }}
        >
          {renderLeafClue(node, solved)}
        </div>
        <p
          className="text-[15px] leading-relaxed mt-3"
          style={{ color: "#6b6356", fontFamily: '"David Libre", serif' }}
        >
          {isPeek
            ? "האות הראשונה תופיע בסוף הרמז."
            : "התשובה תיכנס למשפט והניקוד יופחת."}
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-[#e7e0d0] puzzle-mono text-[12px]"
            style={{ color: "#171412", backgroundColor: "#ffffff" }}
          >
            [ביטול]
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-md puzzle-mono text-[12px]"
            style={{ backgroundColor: "#171412", color: "#fbfaf4" }}
          >
            {isPeek ? "[הצצה]" : "[reveal −20]"}
          </button>
        </div>
      </div>
    </div>
  );
}

function renderLeafClue(node: PuzzleNode, solved: Set<string>): React.ReactNode {
  return (node.children ?? []).map((c) => {
    if (c.type === "text") return <TextRun key={c.id} content={c.content ?? ""} />;
    if (c.type === "bracket") {
      if (solved.has(c.id)) {
        return (
          <span key={c.id} style={{ fontWeight: 600 }}>
            <TextRun content={c.answer ?? ""} />
          </span>
        );
      }
      return null;
    }
    return null;
  });
}

function renderPeek(node: PuzzleNode, solved: Set<string>): React.ReactNode {
  const ans = node.answer ?? "";
  const first = ans[0] ?? "";
  return (
    <span>
      {renderLeafClue(node, solved)}{" "}
      <span className="puzzle-mono text-[0.86em]" dir="auto" style={{ fontWeight: 700 }}>
        ({first})
      </span>
    </span>
  );
}
