import { ProjectHtmlEditor } from "@/components/editor/html-editor";

export default async function EditorProjectPage({
  params,
}: Readonly<{
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  return <ProjectHtmlEditor projectId={projectId} />;
}
