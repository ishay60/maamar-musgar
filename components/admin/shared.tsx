export { clueSummary } from "@/lib/puzzle";

export function Empty({ text, tone = "muted" }: { text: string; tone?: "muted" | "error" }) {
  return (
    <div
      className={`puzzle-mono text-[12px] text-center py-4 ${tone === "error" ? "text-red-700" : "text-gray-400"}`}
    >
      {text}
    </div>
  );
}
