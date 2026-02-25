'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  Dna,
  Globe,
  FileText,
  Instagram,
  Video,
  ArrowRight,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ChannelCard {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
  status: 'not_started' | 'in_progress' | 'done';
  count?: number;
}

const statusBadge: Record<string, { label: string; variant: 'secondary' | 'outline' | 'default' }> = {
  not_started: { label: '시작 전', variant: 'secondary' },
  in_progress: { label: '진행 중', variant: 'outline' },
  done: { label: '완료', variant: 'default' },
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // MVP: mock channel data — will be fetched from API later
  const channels: ChannelCard[] = [
    {
      label: '판매사이트',
      href: `/project/${id}/site`,
      icon: Globe,
      description: '랜딩페이지 및 제품 소개 사이트',
      status: 'not_started',
    },
    {
      label: '블로그',
      href: `/project/${id}/blog`,
      icon: FileText,
      description: 'SEO 최적화 블로그 콘텐츠',
      status: 'not_started',
      count: 0,
    },
    {
      label: '인스타그램',
      href: `/project/${id}/instagram`,
      icon: Instagram,
      description: '피드 이미지 및 캡션',
      status: 'not_started',
      count: 0,
    },
    {
      label: '숏폼',
      href: `/project/${id}/shortform`,
      icon: Video,
      description: '틱톡/릴스 스크립트 및 자막',
      status: 'not_started',
      count: 0,
    },
  ];

  // MVP: mock Brand DNA completeness
  const dnaCompleteness = 0;

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold">프로젝트 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          브랜드 분석과 채널별 콘텐츠 현황을 확인하세요.
        </p>
      </div>

      {/* Brand DNA section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dna className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Brand DNA</CardTitle>
            </div>
            <Link
              href={`/project/${id}/brand-dna`}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {dnaCompleteness === 0 ? '시작하기' : '수정하기'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <CardDescription>
            AI 브랜드 분석을 위한 기본 정보를 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={dnaCompleteness} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground">
              {dnaCompleteness}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Channel cards grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">채널</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {channels.map((ch) => {
            const Icon = ch.icon;
            const badge = statusBadge[ch.status];
            return (
              <Link key={ch.href} href={ch.href} className="group block">
                <Card className="h-full transition-shadow hover:shadow-md group-hover:border-primary/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">
                          {ch.label}
                        </CardTitle>
                      </div>
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {ch.description}
                    </p>
                    {ch.count !== undefined && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        생성된 콘텐츠: {ch.count}건
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
