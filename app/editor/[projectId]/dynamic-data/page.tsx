import { ProjectDynamicData } from "@/components/editor/project-dynamic-data";

export default async function EditorDynamicDataPage({
  params,
}: Readonly<{
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  return <ProjectDynamicData projectId={projectId} />;
}