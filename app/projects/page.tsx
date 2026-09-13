"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BookmarkXIcon,
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
  FolderPlusIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { FolderSettingsDialog } from "@/components/projects/folder-settings-dialog";
import { downloadProjectJson } from "@/lib/project-export";
import { normalizeMergeJson } from "@/lib/mail-merge";
import { usePreviewAppearance } from "@/lib/preview-appearance";
import { buildPreviewSrcDoc } from "@/lib/preview-srcdoc";
import {
  addFolder,
  addProject,
  clearProjectRecent,
  createDefaultEnvelope,
  deleteProject,
  duplicateMailrProject,
  loadFolders,
  loadProjects,
  moveProjectToFolder,
  parseEnvelopeConfig,
  updateProjectName,
  type MailrFolder,
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

function compareProjectsByLastOpened(a: MailrProject, b: MailrProject) {
  const ao = a.lastOpenedAt ?? 0;
  const bo = b.lastOpenedAt ?? 0;
  if (bo !== ao) return bo - ao;
  return b.createdAt - a.createdAt;
}

const PREVIEW_BASE_W = 560;
const PREVIEW_BASE_H = 720;

function ProjectCardThumbnail({ html }: { html: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);
  const previewAppearance = usePreviewAppearance();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / PREVIEW_BASE_W);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const empty = html.trim().length === 0;

  return (
    <div
      ref={wrapRef}
      className="relative aspect-[8/5] w-full min-h-[8rem] overflow-hidden bg-muted/50 dark:bg-muted/25"
    >
      {empty ? (
        <div className="text-muted-foreground absolute inset-0 flex items-center justify-center px-6 text-center text-sm leading-snug">
          No preview yet
        </div>
      ) : (
        <iframe
          title="Email preview thumbnail"
          srcDoc={buildPreviewSrcDoc(html, {
            appearance: previewAppearance,
            scrollLock: true,
          })}
          sandbox=""
          className="pointer-events-none absolute top-0 left-0 overflow-hidden border-0 bg-white"
          style={{
            width: PREVIEW_BASE_W,
            height: PREVIEW_BASE_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      )}
    </div>
  );
}

function ProjectCard({
  project: p,
  folderName,
  folders,
  recentStrip,
  onRename,
  onDuplicate,
  onExport,
  onDeleteRequest,
  onMoveToFolder,
  onRemoveFromRecent,
}: {
  project: MailrProject;
  folderName: string;
  folders: MailrFolder[];
  recentStrip?: boolean;
  onRename: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (id: string) => void;
  onDeleteRequest: (project: MailrProject) => void;
  onMoveToFolder: (projectId: string, folderId: string) => void;
  onRemoveFromRecent?: (id: string) => void;
}) {
  const opened =
    p.lastOpenedAt != null &&
    Number.isFinite(p.lastOpenedAt) &&
    p.lastOpenedAt > 0;

  return (
    <div className="group/card bg-card text-card-foreground border-border relative overflow-hidden rounded-xl border shadow-sm transition-[box-shadow,border-color] duration-200 hover:border-foreground/15 hover:shadow-md dark:hover:border-white/12">
      <Link
        href={`/editor/${p.id}`}
        className="ring-ring/60 absolute inset-0 z-0 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Open ${p.name}`}
      />
      <div className="relative z-10 shrink-0 pointer-events-none">
        <ProjectCardThumbnail html={p.html} />
      </div>
      <div className="relative z-10 flex items-start justify-between gap-3 border-border/70 border-t px-4 py-3 pointer-events-none">
        <div className="min-w-0 flex-1 space-y-0.5">
          <h3 className="text-foreground truncate text-sm leading-snug font-semibold tracking-tight">
            {p.name}
          </h3>
          <p className="text-muted-foreground truncate text-xs leading-relaxed">
            {folderName}
          </p>
          <p className="text-muted-foreground text-xs tabular-nums leading-relaxed">
            {opened
              ? `Opened ${timeAgo(p.lastOpenedAt!)}`
              : `Created ${timeAgo(p.createdAt)}`}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:bg-muted hover:text-foreground -mr-1 shrink-0 rounded-md opacity-60 transition-[opacity,colors] group-hover/card:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-events-auto active:scale-[0.96]"
              aria-label="Project actions"
            >
              <MoreVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {recentStrip && onRemoveFromRecent ? (
              <>
                <DropdownMenuItem onSelect={() => onRemoveFromRecent(p.id)}>
                  <BookmarkXIcon />
                  Remove from recent
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem onSelect={() => onRename(p.id)}>
              <PencilIcon />
              Rename
            </DropdownMenuItem>
            {folders.length > 1 ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Move to folder</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                  {folders.map((f) => (
                    <DropdownMenuItem
                      key={f.id}
                      disabled={f.id === p.folderId}
                      onSelect={() => onMoveToFolder(p.id, f.id)}
                    >
                      {f.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : null}
            <DropdownMenuItem onSelect={() => onDuplicate(p.id)}>
              <CopyIcon />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onExport(p.id)}>
              <DownloadIcon />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDeleteRequest(p)}
            >
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<MailrProject[]>([]);
  const [folders, setFolders] = useState<MailrFolder[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderSettingsId, setFolderSettingsId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    null,
  );
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MailrProject | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resolveTargetFolderId(): string | null {
    const list = loadFolders();
    if (
      selectedFolderId != null &&
      list.some((f) => f.id === selectedFolderId)
    ) {
      return selectedFolderId;
    }
    return null;
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setProjects(loadProjects());
    setFolders(loadFolders());
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    function syncFromStorage() {
      setProjects(loadProjects());
      setFolders(loadFolders());
    }
    window.addEventListener("mailr-projects-updated", syncFromStorage);
    return () =>
      window.removeEventListener("mailr-projects-updated", syncFromStorage);
  }, []);

  useEffect(() => {
    if (folders.length === 0) {
      setSelectedFolderId(null);
      return;
    }
    setSelectedFolderId((prev) =>
      prev != null && folders.some((f) => f.id === prev)
        ? prev
        : folders[0]!.id,
    );
  }, [folders]);

  const filteredByFolder = useMemo(() => {
    if (selectedFolderId == null) return [];
    return projects.filter((p) => p.folderId === selectedFolderId);
  }, [projects, selectedFolderId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filteredByFolder;
    return filteredByFolder.filter((p) =>
      p.name.toLowerCase().includes(q),
    );
  }, [filteredByFolder, query]);

  const sortedFiltered = useMemo(
    () => [...filtered].sort(compareProjectsByLastOpened),
    [filtered],
  );

  const recentProjects = useMemo(() => {
    return [...filteredByFolder]
      .filter(
        (p) => typeof p.lastOpenedAt === "number" && p.lastOpenedAt > 0,
      )
      .sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0))
      .slice(0, 8);
  }, [filteredByFolder]);

  const searching = query.trim().length > 0;
  const showRecentStrip = !searching && recentProjects.length > 0;

  function submitNewFolder() {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    const f = addFolder(trimmed);
    if (!f) return;
    setFolders(loadFolders());
    setSelectedFolderId(f.id);
    setNewFolderName("");
    setFolderDialogOpen(false);
    toast.success(`Folder "${f.name}"`);
  }

  function createProject() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const folderId = resolveTargetFolderId();
    if (!folderId) {
      if (loadFolders().length === 0) {
        toast.error("Create a folder first", {
          description: "Use the Folder button above, then try again.",
        });
        setFolderDialogOpen(true);
      } else {
        toast.error("Select a folder", {
          description:
            "Pick which folder tab is active -new projects go there.",
        });
      }
      return;
    }
    const project: MailrProject = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: Date.now(),
      html: "",
      folderId,
      envelope: createDefaultEnvelope(),
    };
    addProject(project);
    setProjects(loadProjects());
    setFolders(loadFolders());
    setName("");
    setCreateOpen(false);
    toast.success(`Created "${project.name}"`);
  }

  function moveFromCard(projectId: string, destFolderId: string) {
    moveProjectToFolder(projectId, destFolderId);
    setProjects(loadProjects());
    toast.success("Moved to folder");
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
    updateProjectName(renamingId, trimmed);
    setProjects(loadProjects());
    setFolders(loadFolders());
    setRenameOpen(false);
    setRenamingId(null);
    toast.success(`Renamed to "${trimmed}"`);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteProject(deleteTarget.id);
    setProjects(loadProjects());
    setFolders(loadFolders());
    toast.success(`Deleted "${deleteTarget.name}"`);
    setDeleteTarget(null);
  }

  function duplicateFromCard(id: string) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    const copy = duplicateMailrProject(p);
    addProject(copy);
    setProjects(loadProjects());
    setFolders(loadFolders());
    toast.success(`Duplicated as "${copy.name}"`);
  }

  function exportProject(id: string) {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    downloadProjectJson(project);
  }

  function removeFromRecent(id: string) {
    clearProjectRecent(id);
    setProjects(loadProjects());
    setFolders(loadFolders());
    toast.success("Removed from recently opened");
  }

  function openImportPicker() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Partial<MailrProject> & {
        smtp?: unknown;
      };
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
      const folderList = loadFolders();
      const fallbackFolderId = resolveTargetFolderId();
      if (!fallbackFolderId) {
        if (folderList.length === 0) {
          toast.error("Create a folder first", {
            description: "Use the Folder button above, then import again.",
          });
          setFolderDialogOpen(true);
        } else {
          toast.error("Select a folder", {
            description:
              "Pick which folder tab is active -imports go there.",
          });
        }
        return;
      }
      let folderId =
        typeof data.folderId === "string" ? data.folderId : fallbackFolderId;
      if (!folderList.some((f) => f.id === folderId)) {
        folderId = fallbackFolderId;
      }
      const mergeRaw = (data as Record<string, unknown>).mergeRows;
      const mergeRows =
        mergeRaw !== undefined ? normalizeMergeJson(mergeRaw) : undefined;
      const mkRaw = (data as Record<string, unknown>).mergeRecipientKey;
      const mk =
        typeof mkRaw === "string" ? mkRaw.trim() : "";
      const mergeRecipientKey =
        mergeRows?.length && mk && mergeRows.some((r) => mk in r)
          ? mk
          : undefined;

      const project: MailrProject = {
        id: crypto.randomUUID(),
        name: data.name,
        createdAt:
          typeof data.createdAt === "number" ? data.createdAt : Date.now(),
        lastOpenedAt:
          typeof data.lastOpenedAt === "number" &&
          Number.isFinite(data.lastOpenedAt)
            ? data.lastOpenedAt
            : undefined,
        html: data.html,
        folderId,
        envelope: parseEnvelopeConfig(
          "envelope" in data
            ? (data as { envelope?: unknown }).envelope
            : undefined,
        ),
        ...(mergeRows?.length ? { mergeRows } : {}),
        ...(mergeRecipientKey ? { mergeRecipientKey } : {}),
      };
      addProject(project);
      setProjects(loadProjects());
      setFolders(loadFolders());
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
    <div className="bg-background flex min-h-screen flex-1 flex-col">
      <header className="border-border bg-background border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-foreground rounded-sm text-lg font-semibold tracking-tight outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Mailr
          </Link>
          <Link href="/docs" className="text-muted-foreground hover:text-foreground rounded-sm text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring">
            Docs
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {folders.map((f) => (
                <Button
                  key={f.id}
                  type="button"
                  variant={
                    selectedFolderId === f.id ? "default" : "outline"
                  }
                  size="sm"
                  className="h-8 max-w-[11rem] truncate"
                  title={f.name}
                  onClick={() => setSelectedFolderId(f.id)}
                >
                  {f.name}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setFolderDialogOpen(true)}
              >
                <FolderPlusIcon className="size-4 shrink-0" />
                Folder
              </Button>
            </div>

            {folders.length === 0 ? (
              <p className="text-muted-foreground text-sm leading-relaxed">
                Create a folder first - then you can add or import projects.
              </p>
            ) : null}

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
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 gap-2"
                  disabled={
                    folders.length === 0 || selectedFolderId == null
                  }
                  aria-label="Folder settings for selected folder"
                  onClick={() => {
                    if (selectedFolderId) {
                      setFolderSettingsId(selectedFolderId);
                    }
                  }}
                >
                  <Settings2Icon className="size-4 shrink-0" />
                  Folder settings
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-9">
                      Add New
                      <ChevronDownIcon />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onSelect={() => {
                      if (folders.length === 0) {
                        toast.error("Create a folder first", {
                          description:
                            "Use the Folder button above, then create a project.",
                        });
                        setFolderDialogOpen(true);
                        return;
                      }
                      if (!resolveTargetFolderId()) {
                        toast.error("Select a folder", {
                          description:
                            "Pick which folder tab is active - projects go there.",
                        });
                        return;
                      }
                      setCreateOpen(true);
                    }}
                  >
                    <PlusIcon />
                    Create project
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      if (folders.length === 0) {
                        toast.error("Create a folder first", {
                          description:
                            "Use the Folder button above, then import.",
                        });
                        setFolderDialogOpen(true);
                        return;
                      }
                      if (!resolveTargetFolderId()) {
                        toast.error("Select a folder", {
                          description:
                            "Pick which folder tab is active - imports go there.",
                        });
                        return;
                      }
                      openImportPicker();
                    }}
                  >
                    <UploadIcon />
                    Import from JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>

          {showEmpty ? (
            <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
              {folders.length === 0 ? (
                <>
                  No folder yet. Tap{" "}
                  <span className="text-foreground font-medium">Folder</span>{" "}
                  above to add one, then create or import a project.
                </>
              ) : (
                <>
                  No projects in this folder yet. Create one or import a JSON
                  export - it will use the folder selected above.
                </>
              )}
            </div>
          ) : showNoMatches ? (
            <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
              {query.trim().length > 0 ? (
                <>
                  No projects match &ldquo;{query}&rdquo;.
                </>
              ) : (
                "No projects in this folder yet."
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {showRecentStrip ? (
                <section className="space-y-3">
                  <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    Recently opened
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recentProjects.map((p) => (
                      <ProjectCard
                        key={`recent-${p.id}`}
                        recentStrip
                        project={p}
                        folderName={
                          folders.find((f) => f.id === p.folderId)?.name ??
                          "Folder"
                        }
                        folders={folders}
                        onRename={startRename}
                        onDuplicate={duplicateFromCard}
                        onExport={exportProject}
                        onDeleteRequest={setDeleteTarget}
                        onMoveToFolder={moveFromCard}
                        onRemoveFromRecent={removeFromRecent}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {sortedFiltered.length > 0 ? (
                <section className="space-y-3">
                  {showRecentStrip ? (
                    <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      In this folder
                    </h2>
                  ) : null}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sortedFiltered.map((p) => (
                      <ProjectCard
                        key={`all-${p.id}`}
                        project={p}
                        folderName={
                          folders.find((f) => f.id === p.folderId)?.name ??
                          "Folder"
                        }
                        folders={folders}
                        onRename={startRename}
                        onDuplicate={duplicateFromCard}
                        onExport={exportProject}
                        onDeleteRequest={setDeleteTarget}
                        onMoveToFolder={moveFromCard}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
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
              New projects are added to the folder you have selected above.
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

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              SMTP is shared by every project in this folder.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitNewFolder();
            }}
            className="flex flex-col gap-3"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Name</span>
              <Input
                autoFocus
                placeholder="Clients"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFolderDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!newFolderName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <FolderSettingsDialog
        folderId={folderSettingsId}
        open={folderSettingsId !== null}
        onOpenChange={(next) => {
          if (!next) setFolderSettingsId(null);
        }}
        folders={folders}
      />

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