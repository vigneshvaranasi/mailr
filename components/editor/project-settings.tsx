"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Copy, Download, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { downloadProjectJson } from "@/lib/project-export";
import {
  addProject,
  deleteProject,
  duplicateMailrProject,
  getProjectById,
  updateProjectName,
} from "@/lib/projects-storage";

type ProjectSettingsProps = {
  projectId: string;
};

function Panel({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "bg-card text-card-foreground border-border rounded-2xl border shadow-sm",
        className,
      )}
    >
      <div className="border-border border-b px-5 py-4 sm:px-6">
        <h3 className="text-foreground text-sm font-semibold tracking-tight">
          {title}
        </h3>
        {description ? (
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function ProjectSettings({ projectId }: ProjectSettingsProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const p = getProjectById(projectId);
    if (!p) {
      setMissing(true);
      return;
    }
    setName(p.name);
    setSavedName(p.name);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [projectId]);

  const nameDirty = name.trim() !== savedName.trim();

  function saveRename(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name required");
      return;
    }
    if (!getProjectById(projectId)) {
      toast.error("Project not found");
      return;
    }
    updateProjectName(projectId, trimmed);
    setSavedName(trimmed);
    setName(trimmed);
    toast.success("Project renamed");
  }

  function exportJson() {
    const p = getProjectById(projectId);
    if (!p) {
      toast.error("Project not found");
      return;
    }
    downloadProjectJson(p);
    toast.success("Export downloaded");
  }

  function duplicate() {
    const p = getProjectById(projectId);
    if (!p) {
      toast.error("Project not found");
      return;
    }
    const copy = duplicateMailrProject(p);
    addProject(copy);
    toast.success(`Duplicated as "${copy.name}"`);
    router.push(`/editor/${copy.id}`);
  }

  function confirmDelete() {
    const p = getProjectById(projectId);
    if (!p) return;
    deleteProject(projectId);
    setDeleteOpen(false);
    toast.success(`Deleted "${p.name}"`);
    router.push("/projects");
  }

  if (missing) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-10 text-center">
        <p className="text-muted-foreground text-sm">This project is not in local storage.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="bg-muted/40 max-w-xl animate-pulse rounded-2xl p-8">
        <div className="bg-muted h-4 w-40 rounded-md" />
        <div className="bg-muted mt-3 h-3 w-full max-w-md rounded-md" />
        <div className="bg-muted mt-8 h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 pb-8">
      <header className="space-y-1">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          Project settings
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Everything below is stored in this browser only.
        </p>
      </header>

      <Panel title="General">
        <form onSubmit={saveRename}>
          <div className="space-y-4 rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                className="text-foreground text-sm font-medium"
                htmlFor="project-name"
              >
                Display name
              </label>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  nameDirty
                    ? "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {nameDirty ? "Unsaved" : "Saved"}
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Welcome email"
                className="h-10 flex-1 bg-background shadow-none"
                autoComplete="off"
              />
              <Button
                type="submit"
                className="h-10 shrink-0 sm:min-w-[5.5rem]"
                disabled={!name.trim() || !nameDirty}
              >
                Save
              </Button>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Shown in the project list and editor header.
            </p>
          </div>
        </form>
      </Panel>

      <Panel title="Actions">
        <div className="space-y-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex gap-3">
              <div
                className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl"
                aria-hidden
              >
                <Copy className="size-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium">Duplicate</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  New project, same HTML, folder, and recipients. Opens the copy.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 sm:min-w-[7.5rem]"
              onClick={duplicate}
            >
              Duplicate
            </Button>
          </div>
          <Separator className="my-5" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex gap-3">
              <div
                className="bg-muted/60 text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-xl"
                aria-hidden
              >
                <Download className="size-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium">Export</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Download a JSON backup you can import from the Projects page.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 sm:min-w-[7.5rem]"
              onClick={exportJson}
            >
              Export…
            </Button>
          </div>
          <Separator className="my-5" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex gap-3">
              <div
                className="bg-destructive/10 text-destructive flex size-10 shrink-0 items-center justify-center rounded-xl"
                aria-hidden
              >
                <Trash2 className="size-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium">Delete project</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Permanently remove from this browser. Cannot be undone.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="text-destructive border-destructive/40 hover:bg-destructive/5 shrink-0 sm:min-w-[7.5rem]"
              onClick={() => setDeleteOpen(true)}
            >
              Delete…
            </Button>
          </div>
        </div>
      </Panel>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm gap-4">
          <DialogHeader className="space-y-3 text-left">
            <div className="bg-destructive/10 text-destructive flex size-11 items-center justify-center rounded-full">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle>Delete this project?</DialogTitle>
            <DialogDescription className="text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">{savedName}</span> will
              be removed from local storage on this device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}