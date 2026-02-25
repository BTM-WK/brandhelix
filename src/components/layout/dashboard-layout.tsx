'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  projects: Project[];
}

export function DashboardLayout({ children, projects }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const hamburgerButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 md:hidden"
      onClick={() => setMobileOpen(true)}
      aria-label="메뉴 열기"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar
          projects={projects}
          onNewProject={() => {
            // 새 프로젝트 생성 — parent or router handler will be wired later
          }}
        />
      </div>

      {/* Mobile sidebar via Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar
            projects={projects}
            onNewProject={() => {
              setMobileOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Right column: header + main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header menuButton={hamburgerButton} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
