'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  LogOut,
  Settings,
  User,
} from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Map URL path segments to Korean display labels
const segmentLabelMap: Record<string, string> = {
  projects: '프로젝트',
  project: '프로젝트',
  'brand-dna': 'Brand DNA',
  site: '판매사이트',
  blog: '블로그',
  instagram: '인스타그램',
  shortform: '숏폼',
  style: '스타일',
  analytics: '분석',
  settings: '설정',
  usage: '사용량',
};

interface BreadcrumbSegment {
  label: string;
  href: string;
}

function parseBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbSegment[] = [];
  let accumulatedPath = '';

  for (const segment of segments) {
    accumulatedPath += `/${segment}`;

    // Skip dynamic route segments that look like IDs (e.g., proj-1, uuid)
    // but still include them in the path accumulation
    const isId = /^[a-z0-9]+-[a-z0-9-]+$/.test(segment) || segment.startsWith('proj-');

    if (!isId) {
      const label = segmentLabelMap[segment] ?? segment;
      breadcrumbs.push({ label, href: accumulatedPath });
    }
  }

  return breadcrumbs;
}

interface HeaderProps {
  onMenuToggle?: () => void;
  menuButton?: React.ReactNode;
}

export function Header({ menuButton }: HeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = parseBreadcrumbs(pathname);

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      {/* Left: hamburger (mobile) + Breadcrumb */}
      <div className="flex items-center gap-2">
        {menuButton}

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1 text-sm">
            <li>
              <Link
                href="/projects"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                홈
              </Link>
            </li>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={crumb.href} className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  {isLast ? (
                    <span className="font-medium text-foreground">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className={cn(
                        'text-muted-foreground transition-colors hover:text-foreground'
                      )}
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Right: User avatar + dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-8 w-8">
              <AvatarImage src={undefined} alt="사용자" />
              <AvatarFallback className="text-xs font-semibold">
                BH
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:block">사용자</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex cursor-pointer items-center gap-2">
              <User className="h-4 w-4" />
              <span>프로필</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex cursor-pointer items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>설정</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
            onClick={() => {
              // MVP: logout placeholder — wire to Supabase signOut later
              console.info('로그아웃');
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>로그아웃</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
