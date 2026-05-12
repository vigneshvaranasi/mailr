const MAILR_PROJECTS_STORAGE_KEY = "mailr.projects";

export type MailrProject = {
  id: string;
  name: string;
  createdAt: number;
  html: string;
};

export function loadProjects(): MailrProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MAILR_PROJECTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MailrProject[]) : [];
  } catch {
    return [];
  }
}

export function persistProjects(projects: MailrProject[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    MAILR_PROJECTS_STORAGE_KEY,
    JSON.stringify(projects)
  );
}

export function getProjectById(id: string): MailrProject | undefined {
  return loadProjects().find((p) => p.id === id);
}