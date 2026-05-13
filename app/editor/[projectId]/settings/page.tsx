import { ProjectSettings } from "@/components/editor/project-settings";

export default async function EditorSettingsPage({
  params,
}: Readonly<{
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  return <ProjectSettings projectId={projectId} />;
}