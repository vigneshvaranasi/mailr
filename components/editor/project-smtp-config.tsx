"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDefaultSmtpConfig,
  getProjectById,
  updateProjectSmtp,
  type MailrSmtpConfig,
} from "@/lib/projects-storage";

type ProjectSmtpConfigProps = {
  projectId: string;
};

export function ProjectSmtpConfig({ projectId }: ProjectSmtpConfigProps) {
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const [form, setForm] = useState<MailrSmtpConfig>(createDefaultSmtpConfig);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from localStorage */
    setMissing(false);
    setReady(false);
    const p = getProjectById(projectId);
    if (!p) {
      setMissing(true);
      return;
    }
    setForm({ ...p.smtp });
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [projectId]);

  const setField = useCallback(<K extends keyof MailrSmtpConfig>(key: K, value: MailrSmtpConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  function save(e: FormEvent) {
    e.preventDefault();
    const p = getProjectById(projectId);
    if (!p) {
      toast.error("Project not found");
      return;
    }
    const port = Number(form.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      toast.error("Invalid port", { description: "Use 1-65535." });
      return;
    }
    const next: MailrSmtpConfig = {
      ...form,
      port,
    };
    updateProjectSmtp(projectId, next);
    toast.success("SMTP settings saved");
  }

  if (missing) {
    return (
      <p className="text-muted-foreground text-sm">
        Project not found. It may have been removed.
      </p>
    );
  }

  if (!ready) {
    return (
      <p className="text-muted-foreground text-sm">Loading…</p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div>
        <h2 className="text-foreground text-lg font-semibold">SMTP config</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Outbound mail settings for this project. Stored only in this
          browser; not sent to a server until you send mail.
        </p>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="smtp-host">
            Host
          </label>
          <Input
            id="smtp-host"
            autoComplete="off"
            placeholder="smtp.example.com"
            value={form.host}
            onChange={(e) => setField("host", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="smtp-port">
            Port
          </label>
          <Input
            id="smtp-port"
            type="number"
            min={1}
            max={65535}
            inputMode="numeric"
            value={form.port}
            onChange={(e) =>
              setField("port", Number(e.target.value) || 0)
            }
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={form.secure}
            onChange={(e) => setField("secure", e.target.checked)}
            className="border-input size-4 rounded border accent-primary"
          />
          <span className="text-sm font-medium">Implicit TLS (SSL)</span>
          <span className="text-muted-foreground text-xs font-normal">
            e.g. port 465; leave off for STARTTLS on 587
          </span>
        </label>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="smtp-user">
            Username
          </label>
          <Input
            id="smtp-user"
            autoComplete="username"
            value={form.username}
            onChange={(e) => setField("username", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="smtp-pass">
            Password
          </label>
          <Input
            id="smtp-pass"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
          />
        </div>

        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}