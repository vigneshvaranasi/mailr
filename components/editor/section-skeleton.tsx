type EditorSectionSkeletonProps = {
  title: string;
};

export function EditorSectionSkeleton({
  title,
}: EditorSectionSkeletonProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
    </div>
  );
}
