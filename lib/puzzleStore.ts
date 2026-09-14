import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildPuzzle } from "./puzzle/build";
import type { BuildPuzzleInput } from "./puzzle/build";
import type { Puzzle } from "./puzzle/types";
import { puzzles as builtPuzzles } from "./puzzle/puzzles";

/**
 * Where data/puzzles.json lives when the admin saves.
 *  - Local dev: the working-tree file.
 *  - Deployed: the file in the GitHub repo. Each save is a commit, which
 *    triggers a redeploy, so the new puzzle goes live with the next build.
 */
export interface PuzzleStore {
  read(): Promise<string | null>;
  write(json: string, message: string): Promise<{ location: string }>;
}

const FILE = "data/puzzles.json";

export function puzzleStore(env = process.env): PuzzleStore | null {
  if (env.GITHUB_TOKEN && env.GITHUB_REPO) {
    return githubStore(env.GITHUB_TOKEN, env.GITHUB_REPO, env.GITHUB_BRANCH ?? "main");
  }
  if (env.NODE_ENV === "development") return localStore();
  return null;
}

function localStore(): PuzzleStore {
  const file = path.join(process.cwd(), FILE);
  return {
    async read() {
      return readFile(file, "utf8").catch(() => null);
    },
    async write(json) {
      await writeFile(file, json, "utf8");
      return { location: FILE };
    },
  };
}

function githubStore(token: string, repo: string, branch: string): PuzzleStore {
  const url = `https://api.github.com/repos/${repo}/contents/${FILE}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  let sha: string | undefined;
  return {
    async read() {
      const res = await fetch(`${url}?ref=${branch}`, { headers, cache: "no-store" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`);
      const body = (await res.json()) as { sha: string; content: string };
      sha = body.sha;
      return Buffer.from(body.content, "base64").toString("utf8");
    },
    async write(json, message) {
      const res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message,
          branch,
          sha,
          content: Buffer.from(json).toString("base64"),
        }),
      });
      if (!res.ok) throw new Error(`GitHub write failed: ${res.status} ${await res.text()}`);
      return { location: `${repo}@${branch}:${FILE} (deploying)` };
    },
  };
}

/**
 * Live puzzle list for the admin: what is in the store right now (a save is
 * visible immediately, before the redeploy). Falls back to the built-in copy
 * when no store is configured or it cannot be read.
 */
export async function loadLivePuzzles(): Promise<Puzzle[]> {
  const raw = await puzzleStore()?.read().catch(() => null);
  if (!raw) return builtPuzzles;
  try {
    return (JSON.parse(raw) as BuildPuzzleInput[])
      .map(buildPuzzle)
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return builtPuzzles;
  }
}
