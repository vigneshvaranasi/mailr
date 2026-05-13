const MAILR_PROJECTS_STORAGE_KEY = "mailr.projects";

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

export type MailrProject = {
  id: string;
  name: string;
  createdAt: number;
  html: string;
  smtp: MailrSmtpConfig;
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

function withProjectDefaults(p: MailrProject): MailrProject {
  return {
    ...p,
    smtp: parseSmtpConfig(p.smtp),
    envelope: parseEnvelopeConfig(p.envelope),
  };
}

export function loadProjects(): MailrProject[] {
  if (typeof window === "undefined") return [];
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
}

export function getProjectById(id: string): MailrProject | undefined {
  const p = loadProjects().find((x) => x.id === id);
  return p;
}

export function updateProjectHtml(id: string, html: string) {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const next = [...projects];
  next[idx] = { ...next[idx], html };
  persistProjects(next);
}

export function updateProjectSmtp(id: string, smtp: MailrSmtpConfig) {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const next = [...projects];
  next[idx] = { ...next[idx], smtp };
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