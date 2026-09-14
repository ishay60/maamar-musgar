"use client";

import { useEffect } from "react";

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(23, 20, 18, 0.45)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="איך משחקים"
    >
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{ backgroundColor: "#fbfaf4", border: "1px solid #e7e0d0" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="puzzle-mono text-[13px] tracking-wider uppercase" style={{ color: "#6b6356" }}>
          איך משחקים
        </div>
        <h2 className="text-2xl font-bold mt-1" style={{ fontFamily: '"David Libre", serif' }}>
          מאמר מוסגר
        </h2>
        <ol className="mt-4 space-y-3 text-[15px] leading-relaxed" style={{ fontFamily: '"David Libre", serif' }}>
          <li>
            <b>פותרים מבפנים החוצה.</b> רק סוגר שאין לו סוגרים פתוחים בתוכו מוכן
            לפתרון (מוצג בצבע כחול).
          </li>
          <li>
            <b>מקלידים בלי ללחוץ.</b> פשוט התחילו להקליד את התשובה. <span className="puzzle-mono">Enter</span> לשליחה,
            <span className="puzzle-mono"> Esc</span> לניקוי.
          </li>
          <li>
            <b>ניקוד.</b> מתחילים מ-100. כל טעות עולה 2 נקודות,
            <span className="puzzle-mono"> [peek]</span> 5,
            <span className="puzzle-mono"> [reveal]</span> 20.
          </li>
          <li>
            <b>דירוגי עיר.</b> פתרון נקי זוכה בכבוד <b>בורא המלכים</b>. כמה
            מעידות עוד שומרות על דירוג ראש העיר. פתרון עם הרבה עזרה — תייר.
          </li>
        </ol>
        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md puzzle-mono text-[13px]"
            style={{ backgroundColor: "#171412", color: "#fbfaf4" }}
          >
            [close]
          </button>
        </div>
      </div>
    </div>
  );
}
