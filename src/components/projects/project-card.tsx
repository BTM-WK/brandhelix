'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { FolderOpen, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project, ProjectStatus } from '@/types/project';

interface ProjectCardProps {
  project: Project;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  draft: {
    label: '초안',
    className: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
  },
  dna_collecting: {
    label: 'DNA 수집중',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  dna_complete: {
    label: 'DNA 완료',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  generating: {
    label: '생성중',
    className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  },
  active: {
    label: '활성',
    className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  },
  paused: {
    label: '일시정지',
    className: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  },
};

export function ProjectCard({ project }: ProjectCardProps) {
  const status = statusConfig[project.status];
  const formattedDate = format(new Date(project.createdAt), 'yyyy.MM.dd');

  return (
    <Link href={`/project/${project.id}`} className="block group">
      <Card className="h-full transition-shadow duration-200 hover:shadow-md group-hover:border-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FolderOpen className="h-5 w-5 shrink-0 text-muted-foreground" />
              <CardTitle className="text-base font-semibold truncate">
                {project.name}
              </CardTitle>
            </div>
            <Badge
              variant="secondary"
              className={`shrink-0 text-xs font-medium ${status.className}`}
            >
              {status.label}
            </Badge>
          </div>
          {project.industry && (
            <CardDescription className="mt-1 pl-7">
              <Badge variant="outline" className="text-xs font-normal">
                {project.industry}
              </Badge>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
