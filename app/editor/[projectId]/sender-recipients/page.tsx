import { ProjectSenderRecipients } from "@/components/editor/project-sender-recipients";

export default async function EditorSenderRecipientsPage({
  params,
}: Readonly<{
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  return <ProjectSenderRecipients projectId={projectId} />;
}