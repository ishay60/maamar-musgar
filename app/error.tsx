"use client";

import { useEffect } from "react";

/** Any render error: never leave the player stuck on a dead page. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <main className="mx-auto max-w-sm p-8 text-center puzzle-mono text-[13px] flex flex-col gap-3" style={{ color: "#6b6356" }}>
      <p>משהו השתבש בטעינת החידה.</p>
      <button type="button" onClick={reset} className="underline underline-offset-4">[לנסות שוב]</button>
      <a href="/" className="underline underline-offset-4">[לחידת היום]</a>
    </main>
  );
}
