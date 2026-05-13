"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDownIcon,
  DownloadIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  createDefaultEnvelope,
  createDefaultSmtpConfig,
  loadProjects,
  parseEnvelopeConfig,
  parseSmtpConfig,
  persistProjects,
  type MailrProject,
} from "@/lib/projects-storage";

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function safeFilename(name: string) {
  const slug = name
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${slug || "project"}.mailr.json`;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<MailrProject[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MailrProject | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage after mount */
    setProjects(loadProjects());
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  function createProject() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const project: MailrProject = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: Date.now(),
      html: "",
      smtp: createDefaultSmtpConfig(),
      envelope: createDefaultEnvelope(),
    };
    const next = [project, ...projects];
    setProjects(next);
    persistProjects(next);
    setName("");
    setCreateOpen(false);
    toast.success(`Created "${project.name}"`);
  }

  function startRename(id: string) {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    setRenamingId(id);
    setRenameValue(project.name);
    setRenameOpen(true);
  }

  function renameProject() {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    const next = projects.map((p) =>
      p.id === renamingId ? { ...p, name: trimmed } : p,
    );
    setProjects(next);
    persistProjects(next);
    setRenameOpen(false);
    setRenamingId(null);
    toast.success(`Renamed to "${trimmed}"`);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const next = projects.filter((p) => p.id !== deleteTarget.id);
    setProjects(next);
    persistProjects(next);
    toast.success(`Deleted "${deleteTarget.name}"`);
    setDeleteTarget(null);
  }

  function exportProject(id: string) {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeFilename(project.name);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function openImportPicker() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Partial<MailrProject>;
      if (
        !data ||
        typeof data !== "object" ||
        typeof data.name !== "string" ||
        typeof data.html !== "string"
      ) {
        toast.error("Invalid project file", {
          description: "Missing required name or html fields.",
        });
        return;
      }
      const project: MailrProject = {
        id: crypto.randomUUID(),
        name: data.name,
        createdAt:
          typeof data.createdAt === "number" ? data.createdAt : Date.now(),
        html: data.html,
        smtp: parseSmtpConfig(
          "smtp" in data ? (data as { smtp?: unknown }).smtp : undefined,
        ),
        envelope: parseEnvelopeConfig(
          "envelope" in data
            ? (data as { envelope?: unknown }).envelope
            : undefined,
        ),
      };
      const next = [project, ...projects];
      setProjects(next);
      persistProjects(next);
      toast.success(`Imported "${project.name}"`);
    } catch {
      toast.error("Couldn't read that file", {
        description: "Make sure it's a valid Mailr JSON export.",
      });
    }
  }

  const showEmpty = hydrated && projects.length === 0;
  const showNoMatches =
    hydrated && projects.length > 0 && filtered.length === 0;

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold">Projects</h2>
            <p className="text-muted-foreground text-sm">
              Your email projects are saved locally in this browser.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative w-full max-w-xs">
                <SearchIcon className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="h-9 pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    Add New
                    <ChevronDownIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onSelect={() => setCreateOpen(true)}>
                    <PlusIcon />
                    Create project
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={openImportPicker}>
                    <UploadIcon />
                    Import from JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {showEmpty ? (
              <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
                No projects yet. Create one or import a previous export.
              </div>
            ) : showNoMatches ? (
              <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
                No projects match &ldquo;{query}&rdquo;.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    className="group bg-card text-card-foreground hover:bg-muted/30 relative rounded-lg border p-4 transition-colors"
                  >
                    <Link
                      href={`/editor/${p.id}`}
                      className="ring-ring/50 absolute inset-0 z-0 rounded-lg outline-none focus-visible:ring-2"
                      aria-label={`Open ${p.name}`}
                    />
                    <div className="relative z-10 flex items-start justify-between gap-2 pointer-events-none">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium leading-tight">
                          {p.name}
                        </h3>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Created {timeAgo(p.createdAt)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="-mt-1 -mr-1 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 pointer-events-auto"
                            aria-label="Project actions"
                          >
                            <MoreVerticalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onSelect={() => startRename(p.id)}
                          >
                            <PencilIcon />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => exportProject(p.id)}
                          >
                            <DownloadIcon />
                            Export as JSON
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleteTarget(p)}
                          >
                            <Trash2Icon />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImportFile(file);
          e.target.value = "";
        }}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new project</DialogTitle>
            <DialogDescription>
              Give your email project a name. You can rename it later.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createProject();
            }}
            className="flex flex-col gap-3"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Name</span>
              <Input
                autoFocus
                placeholder="Welcome email"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; will be permanently removed
              from this browser. This can&rsquo;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open);
          if (!open) setRenamingId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>Give this project a new name.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              renameProject();
            }}
            className="flex flex-col gap-3"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Name</span>
              <Input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
              />
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!renameValue.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}