'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Dna,
  Globe,
  FileText,
  Instagram,
  Video,
  Palette,
  BarChart3,
  Settings,
  Activity,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface SidebarProps {
  projects: Project[];
  onNewProject?: () => void;
}

const projectSubNav = [
  { label: 'Brand DNA', href: 'brand-dna', icon: Dna },
  { label: '판매사이트', href: 'site', icon: Globe },
  { label: '블로그', href: 'blog', icon: FileText },
  { label: '인스타그램', href: 'instagram', icon: Instagram },
  { label: '숏폼', href: 'shortform', icon: Video },
  { label: '스타일', href: 'style', icon: Palette },
  { label: '분석', href: 'analytics', icon: BarChart3 },
];

const statusLabelMap: Record<string, string> = {
  draft: '초안',
  dna_collecting: '수집 중',
  dna_complete: 'DNA 완성',
  generating: '생성 중',
  active: '활성',
  paused: '일시정지',
};

const statusColorMap: Record<string, string> = {
  draft: 'secondary',
  dna_collecting: 'outline',
  dna_complete: 'outline',
  generating: 'outline',
  active: 'default',
  paused: 'secondary',
};

export function Sidebar({ projects, onNewProject }: SidebarProps) {
  const pathname = usePathname();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );

  // Determine which project is currently active from the URL
  const activeProjectId = (() => {
    const match = pathname.match(/\/project\/([^/]+)/);
    return match ? match[1] : null;
  })();

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const isSubNavActive = (projectId: string, href: string) => {
    return pathname === `/project/${projectId}/${href}`;
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-muted/40">
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <Link
          href="/projects"
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <span className="text-lg">BrandHelix</span>
        </Link>
      </div>

      <Separator />

      {/* Main scrollable area */}
      <div className="flex flex-1 flex-col overflow-y-auto py-3">
        {/* Projects section */}
        <div className="px-3">
          <div className="mb-1 flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              프로젝트
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onNewProject}
              title="새 프로젝트"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {projects.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              프로젝트가 없습니다.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {projects.map((project) => {
                const isExpanded = expandedProjects.has(project.id);
                const isActive = activeProjectId === project.id;

                return (
                  <li key={project.id}>
                    {/* Project row */}
                    <button
                      onClick={() => toggleProject(project.id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <FolderOpen className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate text-left">
                        {project.name}
                      </span>
                      <Badge
                        variant={
                          (statusColorMap[project.status] as
                            | 'default'
                            | 'secondary'
                            | 'outline'
                            | 'destructive') ?? 'secondary'
                        }
                        className="hidden shrink-0 text-[10px] lg:inline-flex"
                      >
                        {statusLabelMap[project.status] ?? project.status}
                      </Badge>
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </button>

                    {/* Sub-navigation */}
                    {isExpanded && (
                      <ul className="ml-3 mt-0.5 space-y-0.5 border-l pl-3">
                        {projectSubNav.map(({ label, href, icon: Icon }) => {
                          const active = isSubNavActive(project.id, href);
                          return (
                            <li key={href}>
                              <Link
                                href={`/project/${project.id}/${href}`}
                                className={cn(
                                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                                  active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                              >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                <span>{label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Separator />

      {/* Bottom section */}
      <div className="px-3 py-3">
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                pathname === '/settings'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>설정</span>
            </Link>
          </li>
          <li>
            <Link
              href="/usage"
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                pathname === '/usage'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Activity className="h-4 w-4 shrink-0" />
              <span>사용량</span>
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
