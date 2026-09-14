"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Lightweight CSS-only confetti burst shown when a puzzle is solved.
 * No canvas, no external deps — just a one-shot overlay that fades itself out.
 * Hidden under prefers-reduced-motion via the .confetti rule in globals.css.
 */
export function Confetti({ active }: { active: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!active) return;
    setMounted(true);
    const t = setTimeout(() => setMounted(false), 1400);
    return () => clearTimeout(t);
  }, [active]);

  const pieces = useMemo(() => {
    if (!mounted) return [];
    const colors = ["#a5b4fc", "#86efac", "#fde68a", "#fca5a5", "#c7d2fe", "#34d399"];
    return Array.from({ length: 48 }, (_, i) => {
      const angle = (Math.PI * (i + Math.random())) / 24 - Math.PI / 2;
      const dist = 140 + Math.random() * 120;
      return {
        id: i,
        left: 50 + (Math.random() - 0.5) * 40, // percent
        top: 50 + (Math.random() - 0.5) * 10,
        cx: Math.cos(angle) * dist,
        cy: Math.sin(angle) * dist - 40,
        cr: (Math.random() - 0.5) * 720,
        color: colors[i % colors.length],
        delay: Math.random() * 120,
        size: 6 + Math.round(Math.random() * 6),
      };
    });
  }, [mounted]);

  if (!mounted) return null;
  return (
    <div
      aria-hidden
      className="confetti pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: 2,
            animationDelay: `${p.delay}ms`,
            // @ts-expect-error — CSS custom properties
            "--cx": `${p.cx}px`,
            "--cy": `${p.cy}px`,
            "--cr": `${p.cr}deg`,
          }}
        />
      ))}
    </div>
  );
}
