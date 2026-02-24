export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold">프로젝트 대시보드</h1>
    </div>
  );
}
