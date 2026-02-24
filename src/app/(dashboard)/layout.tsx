export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/40 p-4">
        <h2 className="text-lg font-semibold">BrandHelix</h2>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
