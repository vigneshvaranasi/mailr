"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  createDefaultEnvelope,
  getProjectById,
  getSmtpForProject,
  updateProjectEnvelope,
  type MailrEnvelope,
} from "@/lib/projects-storage";

type ProjectSenderRecipientsProps = {
  projectId: string;
};

const fieldClass = cn(
  "border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

export function ProjectSenderRecipients({
  projectId,
}: ProjectSenderRecipientsProps) {
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const [form, setForm] = useState<MailrEnvelope>(createDefaultEnvelope);
  const [smtpFromHint, setSmtpFromHint] = useState("");

  useEffect(() => {
    function syncFromHint() {
      const s = getSmtpForProject(projectId);
      setSmtpFromHint(s?.username?.trim() ?? "");
    }
    syncFromHint();
    window.addEventListener("mailr-projects-updated", syncFromHint);
    return () =>
      window.removeEventListener("mailr-projects-updated", syncFromHint);
  }, [projectId]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMissing(false);
    setReady(false);
    const p = getProjectById(projectId);
    if (!p) {
      setMissing(true);
      return;
    }
    setForm({ ...p.envelope });
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [projectId]);

  const setField = useCallback(
    <K extends keyof MailrEnvelope>(key: K, value: MailrEnvelope[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  function save(e: FormEvent) {
    e.preventDefault();
    if (!getProjectById(projectId)) {
      toast.error("Project not found");
      return;
    }
    const smtp = getSmtpForProject(projectId);
    updateProjectEnvelope(projectId, {
      ...form,
      fromEmail: smtp?.username?.trim() ?? "",
    });
    toast.success("Sender & recipients saved");
  }

  if (missing) {
    return (
      <p className="text-muted-foreground text-sm">
        Project not found. It may have been removed.
      </p>
    );
  }

  if (!ready) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div>
        <h2 className="text-foreground text-lg font-semibold">
          Sender &amp; recipients
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Stored in this browser only.
          Use commas between multiple addresses.
        </p>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="from-name">
              From name
            </label>
            <Input
              id="from-name"
              autoComplete="name"
              placeholder="Acme Inc"
              value={form.fromName}
              onChange={(e) => setField("fromName", e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="text-sm font-medium">From email</div>
            <div className="border-border bg-muted/40 text-muted-foreground rounded-md border px-3 py-2 text-sm">
              {smtpFromHint ? (
                <span className="text-foreground font-mono text-xs">
                  {smtpFromHint}
                </span>
              ) : (
                <span>Set SMTP username in Folder settings (Projects page).</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="reply-to">
            Reply-To <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Input
            id="reply-to"
            type="email"
            placeholder="support@example.com"
            value={form.replyTo}
            onChange={(e) => setField("replyTo", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="subject">
            Subject{" "}
            <span className="text-muted-foreground font-normal">
              (falls back to project name if empty)
            </span>
          </label>
          <Input
            id="subject"
            placeholder="Welcome aboard"
            value={form.subject}
            onChange={(e) => setField("subject", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="to">
            To
          </label>
          <textarea
            id="to"
            rows={3}
            placeholder="you@example.com, teammate@example.com"
            value={form.to}
            onChange={(e) => setField("to", e.target.value)}
            className={cn(fieldClass, "min-h-[72px] resize-y")}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="cc">
            Cc <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="cc"
            rows={2}
            placeholder=""
            value={form.cc}
            onChange={(e) => setField("cc", e.target.value)}
            className={cn(fieldClass, "min-h-[52px] resize-y")}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="bcc">
            Bcc <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="bcc"
            rows={2}
            placeholder=""
            value={form.bcc}
            onChange={(e) => setField("bcc", e.target.value)}
            className={cn(fieldClass, "min-h-[52px] resize-y")}
          />
        </div>

        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}