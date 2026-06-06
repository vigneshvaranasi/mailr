export type MergeRow = Record<string, string>;

export function substituteMergeTemplate(template: string, row: MergeRow): string {
  let out = template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, rawKey: string) => {
    const k = rawKey.trim();
    return k in row ? row[k] : "";
  });
  out = out.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, key: string) => {
    return key in row ? row[key] : `{${key}}`;
  });
  return out;
}

export function extractPlaceholderKeys(template: string): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  function add(raw: string) {
    const k = raw.trim();
    if (!k || seen.has(k)) return;
    seen.add(k);
    ordered.push(k);
  }

  const stripped = template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, rawKey: string) => {
    add(rawKey);
    return "";
  });
  stripped.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, key: string) => {
    add(key);
    return "";
  });
  return ordered;
}

export function auditMergePlaceholders(
  templates: readonly string[],
  jsonColumnUnion: readonly string[],
): { missingInJson: string[]; jsonKeysUnused: string[] } {
  const used = new Set<string>();
  for (const t of templates) {
    for (const k of extractPlaceholderKeys(t)) used.add(k);
  }
  const cols = new Set(jsonColumnUnion);
  const missingInJson = [...used].filter((k) => !cols.has(k)).sort((a, b) => a.localeCompare(b));
  const jsonKeysUnused = [...cols].filter((c) => !used.has(c)).sort((a, b) => a.localeCompare(b));
  return { missingInJson, jsonKeysUnused };
}

export function normalizeMergeJson(parsed: unknown): MergeRow[] | null {
  if (!Array.isArray(parsed)) return null;
  const out: MergeRow[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const row: MergeRow = {};
    for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
      const key = k.trim();
      if (!key) continue;
      if (typeof v === "string") row[key] = v;
      else if (typeof v === "number" || typeof v === "boolean") row[key] = String(v);
      else if (v === null || v === undefined) row[key] = "";
      else return null;
    }
    out.push(row);
  }
  return out;
}

export function unionMergeColumns(rows: MergeRow[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) set.add(k);
  }
  return [...set].sort();
}

export function guessRecipientColumn(columns: string[]): string {
  const candidates = ["email", "e-mail", "mail", "to"];
  for (const c of columns) {
    const L = c.toLowerCase();
    if (candidates.includes(L)) return c;
  }
  const fuzzy = columns.find((c) => c.toLowerCase().includes("email"));
  return fuzzy ?? columns[0] ?? "";
}