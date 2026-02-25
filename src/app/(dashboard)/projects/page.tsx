'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectCard } from '@/components/projects/project-card';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { useProjectStore } from '@/stores/project-store';
import type { CreateProjectInput } from '@/types/project';

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, isLoading, fetchProjects, createProject } =
    useProjectStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (data: CreateProjectInput) => {
    const project = await createProject(data);
    router.push(`/project/${project.id}/brand-dna`);
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">프로젝트</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            프로젝트를 생성하고 관리하세요.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />새 프로젝트
        </Button>
      </div>

      {/* Project grid */}
      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-lg" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* Empty state */
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="rounded-full bg-muted p-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            아직 프로젝트가 없습니다
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            새 프로젝트를 만들어 AI가 브랜드를 분석하고 마케팅 채널을 자동
            생성하도록 시작하세요.
          </p>
          <Button className="mt-6" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />첫 프로젝트 만들기
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
