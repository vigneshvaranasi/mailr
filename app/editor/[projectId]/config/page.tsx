import { ProjectSmtpConfig } from "@/components/editor/project-smtp-config";

export default async function EditorConfigPage({
  params,
}: Readonly<{
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  return <ProjectSmtpConfig projectId={projectId} />;
}