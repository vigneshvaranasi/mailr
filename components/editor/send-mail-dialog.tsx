"use client";

import { useCallback, useState } from "react";
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
import { splitAddressList } from "@/lib/mail-addresses";
import { getProjectById } from "@/lib/projects-storage";

type SendMailDialogProps = {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function Detail({
  label,
  value,
  empty = "—",
}: {
  label: string;
  value: string;
  empty?: string;
}) {
  const show = value.trim().length > 0 ? value : empty;
  return (
    <div className="space-y-0.5 text-sm">
      <div className="text-muted-foreground text-xs font-medium">{label}</div>
      <div className="text-foreground break-words whitespace-pre-wrap">
        {show}
      </div>
    </div>
  );
}

export function SendMailDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
}: SendMailDialogProps) {
  const [sending, setSending] = useState(false);

  const project = getProjectById(projectId);

  const send = useCallback(async () => {
    const p = getProjectById(projectId);
    if (!p) {
      toast.error("Project not found");
      return;
    }

    if (!p.smtp.host.trim()) {
      toast.error("Set SMTP host in Config", {
        description: "Open Config and save your mail server settings.",
      });
      return;
    }

    if (!p.envelope.fromEmail.trim() || !p.envelope.to.trim()) {
      toast.error("Set From and To", {
        description: "Open Sender & recipients and save.",
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp: p.smtp,
          envelope: p.envelope,
          html: p.html,
          projectName: p.name,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error("Send failed", {
          description: data.error ?? res.statusText,
        });
        return;
      }
      toast.success("Message sent");
      onOpenChange(false);
    } catch {
      toast.error("Network error", { description: "Could not reach the server." });
    } finally {
      setSending(false);
    }
  }, [projectId, onOpenChange]);

  const subject =
    project?.envelope.subject.trim() ||
    projectName.trim() ||
    "No subject";

  const toPreview = project
    ? splitAddressList(project.envelope.to).join(", ")
    : "";
  const ccPreview = project
    ? splitAddressList(project.envelope.cc).join(", ")
    : "";
  const bccPreview = project
    ? splitAddressList(project.envelope.bcc).join(", ")
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send this email?</DialogTitle>
          <DialogDescription>
            Mail is sent through your SMTP settings.
          </DialogDescription>
        </DialogHeader>

        {project ? (
          <div className="border-border space-y-3 rounded-md border p-3">
            <Detail label="Subject" value={subject} />
            <Detail label="To" value={toPreview} empty="(none)" />
            <Detail label="Cc" value={ccPreview} />
            <Detail label="Bcc" value={bccPreview} />
            <Detail label="Reply-To" value={project.envelope.replyTo} />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Project not found.</p>
        )}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void send()}
            disabled={sending || !project}
          >
            {sending ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}