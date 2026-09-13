"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { FolderSmtpForm } from "@/components/projects/folder-smtp-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  deleteFolder,
  getFolderById,
  loadProjects,
  renameFolder,
  type MailrFolder,
} from "@/lib/projects-storage";

type FolderSettingsDialogProps = {
  folderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: MailrFolder[];
};

export function FolderSettingsDialog({
  folderId,
  open,
  onOpenChange,
  folders,
}: FolderSettingsDialogProps) {
  const [renameDraft, setRenameDraft] = useState("");
  const [moveTargetId, setMoveTargetId] = useState("");

  const folder = folderId ? getFolderById(folderId) : undefined;
  const otherFolders = useMemo(
    () => (folderId ? folders.filter((f) => f.id !== folderId) : []),
    [folders, folderId],
  );

  const projectCount =
    folderId && open
      ? loadProjects().filter((p) => p.folderId === folderId).length
      : 0;

  useEffect(() => {
    if (!open || !folderId) return;
    const f = getFolderById(folderId);
    setRenameDraft(f?.name ?? "");
    const others = folders.filter((x) => x.id !== folderId);
    setMoveTargetId(others[0]?.id ?? "");
  }, [open, folderId, folders]);

  function saveRename() {
    if (!folderId) return;
    const trimmed = renameDraft.trim();
    if (!trimmed) {
      toast.error("Name required");
      return;
    }
    renameFolder(folderId, trimmed);
    toast.success("Folder renamed");
  }

  function confirmDelete() {
    if (!folderId) return;
    if (projectCount === 0) {
      const ok = deleteFolder(folderId);
      if (!ok) {
        toast.error("Could not delete folder");
        return;
      }
      toast.success("Folder deleted");
      onOpenChange(false);
      return;
    }
    if (otherFolders.length === 0) {
      toast.error("Move or delete projects before removing this folder.");
      return;
    }
    const target = moveTargetId || otherFolders[0]!.id;
    if (!otherFolders.some((f) => f.id === target)) {
      toast.error("Pick a folder to move projects into");
      return;
    }
    const ok = deleteFolder(folderId, target);
    if (!ok) {
      toast.error("Could not delete folder");
      return;
    }
    toast.success("Folder deleted");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-border shrink-0 border-b px-6 pt-6 pb-4">
          <DialogTitle>Folder settings</DialogTitle>
          <DialogDescription>
            {folder?.name ? (
              <>
                <span className="text-foreground font-medium">{folder.name}</span>
                {" · "}
                rename, SMTP, or delete this folder.
              </>
            ) : (
              "Rename, SMTP, or delete this folder."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-5">
          {!folderId || !folder ? (
            <p className="text-muted-foreground text-sm">Folder not found.</p>
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="text-foreground text-sm font-semibold">Name</h3>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    placeholder="Folder name"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    onClick={() => void saveRename()}
                    disabled={
                      !renameDraft.trim() || renameDraft.trim() === folder.name
                    }
                  >
                    Save name
                  </Button>
                </div>
              </div>

              <Separator />

              <FolderSmtpForm folderId={folder.id} />

              <Separator />

              <div className="space-y-3">
                <h3 className="text-destructive text-sm font-semibold">
                  Delete folder
                </h3>
                {projectCount > 0 && otherFolders.length === 0 ? (
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    This folder still has projects and there is nowhere to move
                    them. Create another folder and move projects there, or
                    delete those projects, then try again.
                  </p>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {projectCount === 0
                        ? "No projects in this folder - you can delete it. SMTP settings for this folder will be removed."
                        : `${projectCount} project${projectCount === 1 ? "" : "s"} will move to the folder below. SMTP settings for this folder will be removed.`}
                    </p>
                    {projectCount > 0 ? (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">
                          Move projects to
                        </span>
                        <select
                          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={moveTargetId || otherFolders[0]?.id}
                          onChange={(e) => setMoveTargetId(e.target.value)}
                        >
                          {otherFolders.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => void confirmDelete()}
                      >
                        Delete folder…
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}