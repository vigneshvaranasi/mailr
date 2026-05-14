"use client";

import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDefaultSmtpConfig,
  getFolderById,
  updateFolderSmtp,
  type MailrSmtpConfig,
} from "@/lib/projects-storage";

type FolderSmtpFormProps = {
  folderId: string;
};

export function FolderSmtpForm({ folderId }: FolderSmtpFormProps) {
  const uid = useId();
  const hostId = `${uid}-host`;
  const portId = `${uid}-port`;
  const userId = `${uid}-user`;
  const passId = `${uid}-pass`;

  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const [form, setForm] = useState<MailrSmtpConfig>(createDefaultSmtpConfig);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMissing(false);
    setReady(false);
    const f = getFolderById(folderId);
    if (!f) {
      setMissing(true);
      return;
    }
    setForm({ ...f.smtp });
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [folderId]);

  const setField = useCallback(
    <K extends keyof MailrSmtpConfig>(key: K, value: MailrSmtpConfig[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  function save(e: FormEvent) {
    e.preventDefault();
    const f = getFolderById(folderId);
    if (!f) {
      toast.error("Folder not found");
      return;
    }
    const port = Number(form.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      toast.error("Invalid port", { description: "Use 1-65535." });
      return;
    }
    const next: MailrSmtpConfig = { ...form, port };
    updateFolderSmtp(folderId, next);
    setForm({ ...next });
    toast.success("SMTP settings saved");
  }

  if (missing) {
    return (
      <p className="text-muted-foreground text-sm">Folder not found.</p>
    );
  }

  if (!ready) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-foreground text-sm font-semibold">SMTP</h3>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Shared by every project in this folder. Stored only in this browser.
        </p>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={hostId}>
            Host
          </label>
          <Input
            id={hostId}
            autoComplete="off"
            placeholder="smtp.example.com"
            value={form.host}
            onChange={(e) => setField("host", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={portId}>
            Port
          </label>
          <Input
            id={portId}
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
          <label className="text-sm font-medium" htmlFor={userId}>
            Username
          </label>
          <Input
            id={userId}
            autoComplete="username"
            value={form.username}
            onChange={(e) => setField("username", e.target.value)}
          />
          <p className="text-muted-foreground text-xs leading-relaxed">
            Also used as the From email when sending from projects in this folder.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={passId}>
            Password
          </label>
          <Input
            id={passId}
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
          />
        </div>

        <Button type="submit">Save SMTP</Button>
      </form>
    </div>
  );
}