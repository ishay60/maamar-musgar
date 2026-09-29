/**
 * In-memory stand-in for the Supabase client, covering only the query
 * builder calls lib/results.ts makes. Tables are plain arrays of rows so a
 * test can seed and inspect them directly.
 */
type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

const PRIMARY_KEYS: Record<string, string[]> = {
  players: ["id"],
  puzzles: ["id"],
  results: ["puzzle_id", "player_id"],
  progress: ["player_id", "puzzle_id"],
};

export function fakeSupabase(tables: Record<string, Row[]>) {
  const table = (name: string) => (tables[name] ??= []);
  const sameKey = (name: string, a: Row, b: Row) => (PRIMARY_KEYS[name] ?? ["id"]).every((k) => a[k] === b[k]);

  function query(name: string) {
    const filters: Filter[] = [];
    let op: "select" | "update" | "insert" | "upsert" = "select";
    let columns = "*";
    let head = false;
    let payload: Row | Row[] = {};
    let ignoreDuplicates = false;
    let single = false;

    const run = () => {
      const rows = table(name);
      if (op === "insert" || op === "upsert") {
        for (const row of Array.isArray(payload) ? payload : [payload]) {
          const at = rows.findIndex((r) => sameKey(name, r, row));
          if (at === -1) rows.push({ ...row });
          else if (op === "insert") return { data: null, error: { code: "23505", message: "duplicate key" } };
          else if (!ignoreDuplicates) rows[at] = { ...rows[at], ...row };
        }
        return { data: null, error: null };
      }
      const hits = rows.filter((r) => filters.every((f) => f(r)));
      if (op === "update") {
        hits.forEach((r) => Object.assign(r, payload));
        return { data: null, error: null };
      }
      if (head) return { data: null, count: hits.length, error: null };
      const data = hits.map((r) => {
        const out: Row = { ...r };
        // Embedded foreign row, e.g. "puzzles(date)" on results.
        const embed = /(\w+)\(([\w,]+)\)/.exec(columns);
        if (embed) {
          const parent = table(embed[1]).find((p) => p.id === r.puzzle_id);
          out[embed[1]] = parent ? Object.fromEntries(embed[2].split(",").map((c) => [c, parent[c]])) : null;
        }
        return out;
      });
      if (single) return { data: data[0] ?? null, error: null };
      return { data, error: null };
    };

    const builder = {
      select(cols = "*", opts?: { head?: boolean }) {
        columns = cols;
        head = !!opts?.head;
        return builder;
      },
      insert(row: Row) {
        op = "insert";
        payload = row;
        return builder;
      },
      upsert(rows: Row | Row[], opts?: { ignoreDuplicates?: boolean }) {
        op = "upsert";
        payload = rows;
        ignoreDuplicates = !!opts?.ignoreDuplicates;
        return builder;
      },
      update(values: Row) {
        op = "update";
        payload = values;
        return builder;
      },
      eq(col: string, v: unknown) {
        filters.push((r) => r[col] === v);
        return builder;
      },
      lt(col: string, v: number) {
        filters.push((r) => (r[col] as number) < v);
        return builder;
      },
      lte(col: string, v: string) {
        filters.push((r) => (r[col] as string) <= v);
        return builder;
      },
      in(col: string, vs: unknown[]) {
        filters.push((r) => vs.includes(r[col]));
        return builder;
      },
      not(col: string, operator: "in", list: string) {
        const excluded = list.replace(/^\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, ""));
        filters.push((r) => !excluded.includes(r[col] as string));
        return builder;
      },
      order() {
        return builder;
      },
      maybeSingle() {
        single = true;
        return builder;
      },
      then<T>(resolve: (v: ReturnType<typeof run>) => T, reject?: (e: unknown) => T) {
        try {
          return Promise.resolve(resolve(run()));
        } catch (e) {
          return reject ? Promise.resolve(reject(e)) : Promise.reject(e);
        }
      },
    };
    return builder;
  }

  return { from: query };
}
