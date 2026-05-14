const MAILR_PROJECTS_STORAGE_KEY = "mailr.projects";
const MAILR_FOLDERS_STORAGE_KEY = "mailr.folders";

export type MailrSmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
};

export type MailrEnvelope = {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  subject: string;
  to: string;
  cc: string;
  bcc: string;
};

export type MailrFolder = {
  id: string;
  name: string;
  createdAt: number;
  smtp: MailrSmtpConfig;
};

export type MailrProject = {
  id: string;
  name: string;
  createdAt: number;
  lastOpenedAt?: number;
  folderId: string;
  html: string;
  envelope: MailrEnvelope;
};

export function createDefaultSmtpConfig(): MailrSmtpConfig {
  return {
    host: "",
    port: 587,
    secure: false,
    username: "",
    password: "",
  };
}

export function createDefaultEnvelope(): MailrEnvelope {
  return {
    fromName: "",
    fromEmail: "",
    replyTo: "",
    subject: "",
    to: "",
    cc: "",
    bcc: "",
  };
}

export function parseEnvelopeConfig(raw: unknown): MailrEnvelope {
  const d = createDefaultEnvelope();
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Record<string, unknown>;
  return {
    fromName: typeof o.fromName === "string" ? o.fromName : d.fromName,
    fromEmail: typeof o.fromEmail === "string" ? o.fromEmail : d.fromEmail,
    replyTo: typeof o.replyTo === "string" ? o.replyTo : d.replyTo,
    subject: typeof o.subject === "string" ? o.subject : d.subject,
    to: typeof o.to === "string" ? o.to : d.to,
    cc: typeof o.cc === "string" ? o.cc : d.cc,
    bcc: typeof o.bcc === "string" ? o.bcc : d.bcc,
  };
}

export function parseSmtpConfig(raw: unknown): MailrSmtpConfig {
  const d = createDefaultSmtpConfig();
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Record<string, unknown>;
  const port = typeof o.port === "number" ? o.port : Number(o.port);
  return {
    host: typeof o.host === "string" ? o.host : d.host,
    port:
      Number.isFinite(port) && port >= 1 && port <= 65535 ? port : d.port,
    secure: typeof o.secure === "boolean" ? o.secure : d.secure,
    username: typeof o.username === "string" ? o.username : d.username,
    password: typeof o.password === "string" ? o.password : d.password,
  };
}

function withFolderDefaults(partial: {
  id: string;
  name: string;
  createdAt: number;
  smtp: unknown;
}): MailrFolder {
  return {
    id: partial.id,
    name: partial.name.trim() ? partial.name.trim() : "Folder",
    createdAt: partial.createdAt,
    smtp: parseSmtpConfig(partial.smtp),
  };
}

function withProjectDefaults(p: MailrProject): MailrProject {
  const lastOpened =
    typeof p.lastOpenedAt === "number" && Number.isFinite(p.lastOpenedAt)
      ? p.lastOpenedAt
      : undefined;
  return {
    ...p,
    lastOpenedAt: lastOpened,
    folderId: typeof p.folderId === "string" ? p.folderId : "",
    envelope: parseEnvelopeConfig(p.envelope),
    html: typeof p.html === "string" ? p.html : "",
    name: typeof p.name === "string" ? p.name : "Untitled",
  };
}

function persistFoldersRaw(folders: MailrFolder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    MAILR_FOLDERS_STORAGE_KEY,
    JSON.stringify(folders),
  );
}

let storageValidated = false;

function wipeMailrStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MAILR_FOLDERS_STORAGE_KEY, "[]");
  window.localStorage.setItem(MAILR_PROJECTS_STORAGE_KEY, "[]");
  notifyProjectsUpdated();
}

function notifyProjectsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("mailr-projects-updated"));
}

/** Drop legacy / corrupt localStorage. Only current shape survives (folders + projects with folderId, no per-project smtp). */
function validateMailrStorageOnce(): void {
  if (typeof window === "undefined") return;
  if (storageValidated) return;
  storageValidated = true;

  let foldersParsed: unknown = [];
  let projectsParsed: unknown = [];
  try {
    const fr = window.localStorage.getItem(MAILR_FOLDERS_STORAGE_KEY);
    foldersParsed = fr ? (JSON.parse(fr) as unknown) : [];
  } catch {
    wipeMailrStorage();
    return;
  }
  try {
    const pr = window.localStorage.getItem(MAILR_PROJECTS_STORAGE_KEY);
    projectsParsed = pr ? (JSON.parse(pr) as unknown) : [];
  } catch {
    wipeMailrStorage();
    return;
  }

  if (!Array.isArray(foldersParsed) || !Array.isArray(projectsParsed)) {
    wipeMailrStorage();
    return;
  }

  const folders: MailrFolder[] = [];
  const folderIdsSeen = new Set<string>();

  for (const row of foldersParsed) {
    if (!row || typeof row !== "object") {
      wipeMailrStorage();
      return;
    }
    const o = row as Record<string, unknown>;
    if (
      typeof o.id !== "string" ||
      typeof o.name !== "string" ||
      typeof o.createdAt !== "number"
    ) {
      wipeMailrStorage();
      return;
    }
    if (folderIdsSeen.has(o.id)) {
      wipeMailrStorage();
      return;
    }
    folderIdsSeen.add(o.id);
    folders.push(
      withFolderDefaults({
        id: o.id,
        name: o.name,
        createdAt: o.createdAt,
        smtp: o.smtp,
      }),
    );
  }

  const folderIds = new Set(folders.map((f) => f.id));
  const projectIdsSeen = new Set<string>();

  for (const row of projectsParsed) {
    if (!row || typeof row !== "object") {
      wipeMailrStorage();
      return;
    }
    const o = row as Record<string, unknown>;
    if ("smtp" in o) {
      wipeMailrStorage();
      return;
    }
    if (
      typeof o.id !== "string" ||
      typeof o.name !== "string" ||
      typeof o.html !== "string" ||
      typeof o.folderId !== "string"
    ) {
      wipeMailrStorage();
      return;
    }
    if (!folderIds.has(o.folderId)) {
      wipeMailrStorage();
      return;
    }
    if (typeof o.createdAt !== "number") {
      wipeMailrStorage();
      return;
    }
    if (projectIdsSeen.has(o.id)) {
      wipeMailrStorage();
      return;
    }
    projectIdsSeen.add(o.id);
    if (
      "lastOpenedAt" in o &&
      o.lastOpenedAt != null &&
      (typeof o.lastOpenedAt !== "number" || !Number.isFinite(o.lastOpenedAt))
    ) {
      wipeMailrStorage();
      return;
    }
  }
}

export function loadFolders(): MailrFolder[] {
  if (typeof window === "undefined") return [];
  validateMailrStorageOnce();
  try {
    const raw = window.localStorage.getItem(MAILR_FOLDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((row) =>
        withFolderDefaults({
          id: typeof row.id === "string" ? row.id : crypto.randomUUID(),
          name: typeof row.name === "string" ? row.name : "Folder",
          createdAt:
            typeof row.createdAt === "number" ? row.createdAt : Date.now(),
          smtp: row.smtp,
        }),
      );
  } catch {
    return [];
  }
}

export function persistFolders(folders: MailrFolder[]) {
  if (typeof window === "undefined") return;
  persistFoldersRaw(folders);
  notifyProjectsUpdated();
}

export function getFolderById(id: string): MailrFolder | undefined {
  return loadFolders().find((f) => f.id === id);
}

export function addFolder(name: string): MailrFolder | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const folder: MailrFolder = {
    id: crypto.randomUUID(),
    name: trimmed,
    createdAt: Date.now(),
    smtp: createDefaultSmtpConfig(),
  };
  persistFolders([folder, ...loadFolders()]);
  return folder;
}

export function renameFolder(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const folders = loadFolders();
  const idx = folders.findIndex((f) => f.id === id);
  if (idx === -1) return;
  const next = [...folders];
  next[idx] = { ...next[idx], name: trimmed };
  persistFolders(next);
}

export function updateFolderSmtp(folderId: string, smtp: MailrSmtpConfig) {
  const folders = loadFolders();
  const idx = folders.findIndex((f) => f.id === folderId);
  if (idx === -1) return;
  const next = [...folders];
  next[idx] = { ...next[idx], smtp };
  persistFolders(next);
}

export function deleteFolder(
  folderId: string,
  moveToFolderId?: string,
): boolean {
  const folders = loadFolders();
  if (!folders.some((f) => f.id === folderId)) return false;

  const projects = loadProjects();
  const countInFolder = projects.filter((p) => p.folderId === folderId).length;

  if (countInFolder === 0) {
    const remaining = folders.filter((f) => f.id !== folderId);
    persistFolders(remaining);
    return true;
  }

  if (folders.length <= 1) return false;

  const target = moveToFolderId;
  if (!target || target === folderId) return false;
  const remaining = folders.filter((f) => f.id !== folderId);
  if (!remaining.some((f) => f.id === target)) return false;

  const nextProjects = projects.map((p) =>
    p.folderId === folderId ? { ...p, folderId: target } : p,
  );
  persistProjects(nextProjects);
  persistFolders(remaining);
  return true;
}

export function moveProjectToFolder(projectId: string, folderId: string) {
  const folders = loadFolders();
  if (!folders.some((f) => f.id === folderId)) return;
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return;
  const next = [...projects];
  next[idx] = { ...next[idx], folderId };
  persistProjects(next);
}

export function loadProjects(): MailrProject[] {
  if (typeof window === "undefined") return [];
  validateMailrStorageOnce();
  try {
    const raw = window.localStorage.getItem(MAILR_PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) =>
      withProjectDefaults(row as MailrProject),
    );
  } catch {
    return [];
  }
}

export function persistProjects(projects: MailrProject[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    MAILR_PROJECTS_STORAGE_KEY,
    JSON.stringify(projects),
  );
  notifyProjectsUpdated();
}

export function getProjectById(id: string): MailrProject | undefined {
  const p = loadProjects().find((x) => x.id === id);
  return p;
}

export function getSmtpForProject(projectId: string): MailrSmtpConfig | undefined {
  const p = getProjectById(projectId);
  if (!p) return undefined;
  const f = getFolderById(p.folderId);
  return f?.smtp;
}

export function updateProjectName(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const next = [...projects];
  next[idx] = { ...next[idx], name: trimmed };
  persistProjects(next);
}

export function touchProjectOpened(id: string) {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const next = [...projects];
  next[idx] = { ...next[idx], lastOpenedAt: Date.now() };
  persistProjects(next);
}

export function clearProjectRecent(id: string) {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const next = [...projects];
  const { lastOpenedAt: _removed, ...rest } = next[idx];
  next[idx] = rest as MailrProject;
  persistProjects(next);
}

export function deleteProject(id: string) {
  const next = loadProjects().filter((p) => p.id !== id);
  persistProjects(next);
}

export function addProject(project: MailrProject) {
  const next = [project, ...loadProjects()];
  persistProjects(next);
}

/** Deep copy with new id, name suffix, fresh createdAt; stays in same folder. */
export function duplicateMailrProject(source: MailrProject): MailrProject {
  return {
    id: crypto.randomUUID(),
    name: `${source.name} (copy)`,
    createdAt: Date.now(),
    folderId: source.folderId,
    html: source.html,
    envelope: { ...source.envelope },
  };
}

export function updateProjectHtml(id: string, html: string) {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const next = [...projects];
  next[idx] = { ...next[idx], html };
  persistProjects(next);
}

export function updateProjectEnvelope(id: string, envelope: MailrEnvelope) {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const next = [...projects];
  next[idx] = { ...next[idx], envelope };
  persistProjects(next);
}