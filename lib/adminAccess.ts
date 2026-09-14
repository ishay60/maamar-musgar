/** Admin studio is on only when the server-side WORKSPACE env is "local". Never a NEXT_PUBLIC_ var. */
export function isAdminEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.WORKSPACE === "local";
}
