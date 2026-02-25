import { DashboardLayout } from '@/components/layout/dashboard-layout';

// MVP mock data — replace with Supabase fetch (server-side) in a later phase
const mockProjects = [
  { id: 'proj-1', name: '브랜드A 마케팅', status: 'active' },
  { id: 'proj-2', name: '신제품 런칭', status: 'dna_complete' },
  { id: 'proj-3', name: '리브랜딩 프로젝트', status: 'draft' },
];

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout projects={mockProjects}>
      {children}
    </DashboardLayout>
  );
}
