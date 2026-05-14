"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getProjectById } from "@/lib/projects-storage";

import { AppSidebar } from "./appsidebar";
import { SendMailDialog } from "./send-mail-dialog";

type EditorWorkspaceProps = {
  projectId: string;
  children: React.ReactNode;
};

export function EditorWorkspace({ projectId, children }: EditorWorkspaceProps) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"pending" | "ok" | "missing">("pending");
  const [projectName, setProjectName] = useState("");
  const [sendOpen, setSendOpen] = useState(false);

  const base = `/editor/${projectId}`;
  const isMainEditor = pathname === base || pathname === `${base}/`;

  const contentClass = isMainEditor
    ? "flex min-h-0 flex-1 flex-col overflow-hidden p-0"
    : "min-h-0 flex-1 overflow-auto p-4 md:p-6";

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const p = getProjectById(projectId);
    if (!p) {
      setPhase("missing");
      return;
    }
    setProjectName(p.name);
    setPhase("ok");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [projectId]);

  useEffect(() => {
    function syncHeaderTitle() {
      const p = getProjectById(projectId);
      if (p) {
        setProjectName(p.name);
      }
    }
    window.addEventListener("mailr-projects-updated", syncHeaderTitle);
    return () =>
      window.removeEventListener("mailr-projects-updated", syncHeaderTitle);
  }, [projectId]);

  if (phase === "pending") {
    return (
      <div className="bg-background text-muted-foreground flex min-h-dvh items-center justify-center text-sm">
        Loading project…
      </div>
    );
  }

  if (phase === "missing") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <div className="text-center">
          <h1 className="text-foreground text-lg font-semibold">
            Project not found
          </h1>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            This id is not in local storage. It may have been removed or opened
            on another browser profile.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar projectId={projectId} />
      <SidebarInset className="flex max-h-dvh flex-col overflow-hidden">
        <header className="border-sidebar-border bg-sidebar text-sidebar-foreground flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <Link
              href="/"
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground shrink-0 text-sm font-semibold tracking-tight transition-colors"
            >
              Mailr
            </Link>
            <span
              className="bg-sidebar-border hidden h-4 w-px shrink-0 sm:block"
              aria-hidden
            />
            <h1 className="min-w-0 truncate text-sm font-semibold md:text-base">
              {projectName}
            </h1>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setSendOpen(true)}
          >
            Send mail
          </Button>
        </header>
        <SendMailDialog
          projectId={projectId}
          projectName={projectName}
          open={sendOpen}
          onOpenChange={setSendOpen}
        />
        <div className={contentClass}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}