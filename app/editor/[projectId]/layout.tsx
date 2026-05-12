import { EditorWorkspace } from "@/components/editor/editor-workspace";

export default async function EditorProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  return (
    <EditorWorkspace key={projectId} projectId={projectId}>
      {children}
    </EditorWorkspace>
  );
}