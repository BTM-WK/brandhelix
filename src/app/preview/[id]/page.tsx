export default function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold">사이트 미리보기</h1>
    </div>
  );
}
