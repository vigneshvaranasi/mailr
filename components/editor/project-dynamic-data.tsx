"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isLooseEmail } from "@/lib/mail-addresses";
import {
  auditMergePlaceholders,
  guessRecipientColumn,
  normalizeMergeJson,
  substituteMergeTemplate,
  unionMergeColumns,
  type MergeRow,
} from "@/lib/mail-merge";
import {
  getProjectById,
  getSmtpForProject,
  updateProjectMergeData,
} from "@/lib/projects-storage";

import { JsonCodeEditor } from "./json-code-editor";

type ProjectDynamicDataProps = {
  projectId: string;
};

const SAMPLE_JSON = `[
  { "email": "alice@example.com", "Name": "Alice", "Plan": "Pro" },
  { "email": "bob@example.com", "Name": "Bob", "Plan": "Free" }
]`;

function resolveRecipientColumn(cols: string[], hint: string): string {
  if (cols.length === 0) return "";
  const h = hint.trim();
  return h && cols.includes(h) ? h : guessRecipientColumn(cols);
}

function countValidEmails(rows: MergeRow[], rk: string): number {
  if (!rk) return 0;
  let n = 0;
  for (const row of rows) {
    const addr = row[rk]?.trim() ?? "";
    if (addr && isLooseEmail(addr)) n++;
  }
  return n;
}

function mergeUiFromInputs(
  jsonText: string,
  savedRows: MergeRow[],
  recipientHint: string,
): {
  previewRows: MergeRow[];
  columns: string[];
  resolvedRecipientKey: string;
  validSendCount: number;
} {
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    const n = normalizeMergeJson(parsed);
    if (!n) {
      const cols = unionMergeColumns(savedRows);
      const rk = resolveRecipientColumn(cols, recipientHint);
      return {
        previewRows: savedRows,
        columns: cols,
        resolvedRecipientKey: rk,
        validSendCount: countValidEmails(savedRows, rk),
      };
    }
    if (n.length === 0) {
      return {
        previewRows: [],
        columns: [],
        resolvedRecipientKey: "",
        validSendCount: 0,
      };
    }
    const cols = unionMergeColumns(n);
    const rk = resolveRecipientColumn(cols, recipientHint);
    return {
      previewRows: n,
      columns: cols,
      resolvedRecipientKey: rk,
      validSendCount: countValidEmails(n, rk),
    };
  } catch {
    const cols = unionMergeColumns(savedRows);
    const rk = resolveRecipientColumn(cols, recipientHint);
    return {
      previewRows: savedRows,
      columns: cols,
      resolvedRecipientKey: rk,
      validSendCount: countValidEmails(savedRows, rk),
    };
  }
}

export function ProjectDynamicData({ projectId }: ProjectDynamicDataProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [missing, setMissing] = useState(false);
  const [rows, setRows] = useState<MergeRow[]>([]);
  const [jsonText, setJsonText] = useState("");
  const [recipientKey, setRecipientKey] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [projectRevision, setProjectRevision] = useState(0);

  useEffect(() => {
    function bump() {
      setProjectRevision((n) => n + 1);
    }
    window.addEventListener("mailr-projects-updated", bump);
    return () => window.removeEventListener("mailr-projects-updated", bump);
  }, []);

  const syncFromProject = useCallback(() => {
    const p = getProjectById(projectId);
    if (!p) {
      setMissing(true);
      return;
    }
    setMissing(false);
    const r = p.mergeRows ?? [];
    setRows(r);
    setJsonText(r.length > 0 ? JSON.stringify(r, null, 2) : "");
    const cols = unionMergeColumns(r);
    const saved = p.mergeRecipientKey?.trim();
    if (saved && cols.includes(saved)) {
      setRecipientKey(saved);
    } else if (cols.length > 0) {
      setRecipientKey(guessRecipientColumn(cols));
    } else {
      setRecipientKey("");
    }
  }, [projectId]);

  useEffect(() => {
    syncFromProject();
    window.addEventListener("mailr-projects-updated", syncFromProject);
    return () =>
      window.removeEventListener("mailr-projects-updated", syncFromProject);
  }, [syncFromProject]);

  const mergeUi = useMemo(
    () => mergeUiFromInputs(jsonText, rows, recipientKey),
    [jsonText, rows, recipientKey],
  );

  const selectValue =
    mergeUi.columns.length > 0 &&
    recipientKey.trim() &&
    mergeUi.columns.includes(recipientKey.trim())
      ? recipientKey.trim()
      : mergeUi.resolvedRecipientKey;

  const placeholderAudit = useMemo(() => {
    const p = getProjectById(projectId);
    if (!p) return { missingInJson: [] as string[], jsonKeysUnused: [] as string[] };
    return auditMergePlaceholders([p.html, p.envelope.subject], mergeUi.columns);
  }, [projectId, mergeUi.columns, projectRevision]);

  function parseEditorMerge(recipientHint: string): {
    rows: MergeRow[];
    recipientKey: string;
  } | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText) as unknown;
    } catch {
      toast.error("Invalid JSON", {
        description: "Fix syntax in the editor, then save again.",
      });
      return null;
    }
    const n = normalizeMergeJson(parsed);
    if (!n) {
      toast.error("Unsupported merge JSON", {
        description:
          "Use an array like [{ \"email\": \"…\", \"name\": \"…\" }]; values must be strings, numbers, booleans, or null.",
      });
      return null;
    }
    if (n.length === 0) {
      return { rows: [], recipientKey: "" };
    }
    const cols = unionMergeColumns(n);
    const rk = resolveRecipientColumn(cols, recipientHint);
    return { rows: n, recipientKey: rk };
  }

  function saveMergeList() {
    if (!getProjectById(projectId)) {
      toast.error("Project not found");
      return;
    }
    const merged = parseEditorMerge(recipientKey);
    if (!merged) return;
    const { rows: nextRows, recipientKey: rk } = merged;
    setRows(nextRows);
    setRecipientKey(rk);
    if (nextRows.length === 0) {
      updateProjectMergeData(projectId, undefined, undefined);
      toast.success("Rows cleared");
      return;
    }
    updateProjectMergeData(
      projectId,
      nextRows,
      rk.trim() || undefined,
    );
    toast.success(`Saved ${nextRows.length} row(s) with project`);
  }

  function clearAll() {
    setRows([]);
    setJsonText("");
    setRecipientKey("");
    updateProjectMergeData(projectId, undefined, undefined);
    toast.success("Cleared merge data");
  }

  async function onPickFile(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      setJsonText(text);
    } catch {
      toast.error("Could not read file");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function insertSampleJson() {
    setJsonText(SAMPLE_JSON);
    toast.success("Sample JSON inserted");
  }

  async function sendPersonalized() {
    const p = getProjectById(projectId);
    if (!p) {
      toast.error("Project not found");
      return;
    }
    const merged = parseEditorMerge(recipientKey);
    if (!merged) return;
    if (merged.rows.length === 0) {
      toast.error("No recipients", {
        description:
          "Editor JSON is an empty array. Add rows or use Clear.",
      });
      return;
    }
    const sendRows = merged.rows;
    const rk = merged.recipientKey.trim();
    if (!rk) {
      toast.error("Pick recipient column");
      return;
    }
    setRows(sendRows);
    setRecipientKey(rk);
    const smtp = getSmtpForProject(projectId);
    if (!smtp?.host.trim()) {
      toast.error("Set SMTP on folder", {
        description: "Projects → folder → Folder settings.",
      });
      return;
    }
    const fromUser = smtp.username.trim();
    if (!fromUser || !isLooseEmail(fromUser)) {
      toast.error("SMTP username must be sender email");
      return;
    }

    let ok = 0;
    let skipped = 0;
    let failed = 0;
    let firstFailure: string | undefined;

    setSending(true);
    try {
      for (const row of sendRows) {
        const rawTo = row[rk]?.trim() ?? "";
        if (!rawTo || !isLooseEmail(rawTo)) {
          skipped++;
          continue;
        }
        const envelope = {
          ...p.envelope,
          to: rawTo,
          subject: substituteMergeTemplate(p.envelope.subject, row),
          fromName: substituteMergeTemplate(p.envelope.fromName, row),
          replyTo: substituteMergeTemplate(p.envelope.replyTo, row),
          cc: substituteMergeTemplate(p.envelope.cc, row),
          bcc: substituteMergeTemplate(p.envelope.bcc, row),
        };
        const html = substituteMergeTemplate(p.html, row);
        try {
          const res = await fetch("/api/send-mail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              smtp,
              envelope,
              html,
              projectName: p.name,
            }),
          });
          const data = (await res.json()) as { ok?: boolean; error?: string };
          if (!res.ok || !data.ok) {
            failed++;
            console.error("Dynamic mail send failed", {
              recipient: rawTo,
              status: res.status,
              error: data.error ?? res.statusText,
            });
            firstFailure ??= data.error ?? res.statusText;
          } else {
            ok++;
          }
        } catch (err) {
          failed++;
          console.error("Dynamic mail send request failed", {
            recipient: rawTo,
            error: err,
          });
          firstFailure ??=
            err instanceof Error ? err.message : "Could not reach the server.";
        }
      }

      if (ok > 0) {
        toast.success(`Sent ${ok}`, {
          description:
            skipped || failed
              ? firstFailure
                ? `Skipped ${skipped}, failed ${failed}. First error: ${firstFailure}`
                : `Skipped ${skipped}, failed ${failed}`
              : undefined,
        });
        setSendOpen(false);
      } else {
        toast.error("Nothing sent", {
          description:
            firstFailure ??
            (skipped > 0
              ? `${skipped} invalid recipient(s); ${failed} errors`
              : `${failed} send error(s)`),
        });
      }
    } finally {
      setSending(false);
    }
  }

  if (missing) {
    return (
      <p className="text-muted-foreground text-sm">
        Project not found. It may have been removed.
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h2 className="text-foreground text-lg font-semibold">Dynamic data</h2>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
          Paste or import a JSON array of objects
        </p>
      </div>

      <div className="space-y-2">
        <JsonCodeEditor
          id="merge-json"
          aria-labelledby="merge-json-label"
          value={jsonText}
          onChange={setJsonText}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => saveMergeList()}>
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            Import file…
          </Button>
          <Button type="button" variant="outline" onClick={() => insertSampleJson()}>
            Insert sample JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground"
            disabled={rows.length === 0 && jsonText.trim().length === 0}
            onClick={() => clearAll()}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div id="recipient-column-label" className="text-sm font-medium">
          Recipient column (email)
        </div>
        {mergeUi.columns.length === 0 ? (
          <p className="border-border text-muted-foreground rounded-md border border-dashed px-3 py-2 text-sm">
            Add valid JSON in the editor to list column keys here.
          </p>
        ) : (
          <div
            role="radiogroup"
            aria-labelledby="recipient-column-label"
            className="flex flex-wrap gap-2"
          >
            {mergeUi.columns.map((c) => {
              const selected = selectValue === c;
              return (
                <Button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  variant={selected ? "default" : "outline"}
                  size="sm"
                  className="font-mono text-xs"
                  onClick={() => setRecipientKey(c)}
                >
                  {c}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-border bg-muted/15 space-y-3 rounded-lg border p-4">
        <div className="text-sm font-medium">Placeholder check</div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Compares {"{{key}}"} / {"{key}"} in the saved HTML body and Subject against merge
          column names from the preview (case-sensitive).
        </p>
        {mergeUi.columns.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Enter valid merge JSON to see column names here.
          </p>
        ) : (
          <>
            {placeholderAudit.missingInJson.length > 0 ? (
              <div className="space-y-1.5">
                <div className="text-destructive text-xs font-medium">
                  Used in HTML/subject but missing in JSON columns
                </div>
                <ul className="text-destructive/90 list-inside list-disc font-mono text-xs">
                  {placeholderAudit.missingInJson.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {placeholderAudit.jsonKeysUnused.length > 0 ? (
              <div className="space-y-1.5">
                <div className="text-amber-700 text-xs font-medium dark:text-amber-400">
                  JSON columns not referenced in HTML/subject
                </div>
                <ul className="text-muted-foreground list-inside list-disc font-mono text-xs">
                  {placeholderAudit.jsonKeysUnused.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {placeholderAudit.missingInJson.length === 0 &&
            placeholderAudit.jsonKeysUnused.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Placeholders match JSON columns (nothing missing; no unused columns).
              </p>
            ) : null}
          </>
        )}
      </div>

      {mergeUi.columns.length > 0 ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-sm font-medium">Preview</span>
            <span className="text-muted-foreground text-xs font-normal">
              Live from the editor-stored copy updates only when you{" "}
              <strong className="text-foreground font-medium">Save</strong>.
            </span>
          </div>
          <div className="border-border bg-card max-h-[min(24rem,50vh)] overflow-auto rounded-md border">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead className="border-border bg-muted sticky top-0 z-10 border-b shadow-sm">
                <tr>
                  {mergeUi.columns.map((c) => (
                    <th
                      key={c}
                      className="border-border bg-muted text-foreground px-3 py-2 text-left font-medium"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mergeUi.previewRows.map((row, i) => (
                  <tr
                    key={i}
                    className="odd:bg-background even:bg-muted/40 border-border border-b last:border-b-0"
                  >
                    {mergeUi.columns.map((c) => (
                      <td
                        key={c}
                        className="border-border max-w-[14rem] truncate px-3 py-2 font-mono text-xs"
                        title={row[c] ?? ""}
                      >
                        {row[c] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground text-xs">
            {mergeUi.previewRows.length} row(s); {mergeUi.validSendCount}{" "}
            valid email(s) using column &quot;
            {mergeUi.resolvedRecipientKey || "-"}&quot;.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button
          type="button"
          disabled={
            mergeUi.validSendCount === 0 ||
            !mergeUi.resolvedRecipientKey ||
            mergeUi.previewRows.length === 0
          }
          onClick={() => setSendOpen(true)}
        >
          Send personalized…
        </Button>
      </div>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send personalized emails?</DialogTitle>
            <DialogDescription>
              Sends {mergeUi.validSendCount} separate message(s) via SMTP. The
              normal Send mail button uses the fixed To field; this flow replaces
              To with each row&apos;s recipient column.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSendOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void sendPersonalized()}
              disabled={sending || mergeUi.validSendCount === 0}
            >
              {sending ? "Sending…" : "Send all"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}