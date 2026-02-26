'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Dna,
  Globe,
  FileText,
  Instagram,
  Video,
  ArrowRight,
  PenLine,
  ImagePlus,
  TrendingUp,
  Coins,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

import { useBrandDNAStore } from '@/stores/brand-dna-store';
import { ContentList } from '@/components/content/content-list';

import type { ChannelType, ContentStatus, GeneratedContent } from '@/types/content';

// ── 타입 ─────────────────────────────────────────────────────────────────────

interface ChannelCard {
  channel: ChannelType;
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

// ── 상수 ─────────────────────────────────────────────────────────────────────

const STATUS_BADGE_CONFIG: Record<
  'not_started' | 'in_progress' | 'done',
  { label: string; variant: 'secondary' | 'outline' | 'default' }
> = {
  not_started: { label: '시작 전', variant: 'secondary' },
  in_progress: { label: '진행 중', variant: 'outline' },
  done: { label: '완료', variant: 'default' },
};

// 상태별 색상
const CONTENT_STATUS_COLOR: Record<ContentStatus, string> = {
  draft: 'bg-muted-foreground/40',
  approved: 'bg-green-500',
  scheduled: 'bg-blue-500',
  published: 'bg-primary',
};

const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  draft: '초안',
  approved: '승인',
  scheduled: '예약',
  published: '발행',
};

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────

/** 채널별 콘텐츠 수 반환 */
function countByChannel(
  contents: GeneratedContent[],
  channel: ChannelType
): number {
  return contents.filter((c) => c.channel === channel).length;
}

/** 채널에 draft가 있으면 'in_progress', 있으면서 일부 published면 'in_progress', 없으면 'not_started' */
function getChannelStatus(
  contents: GeneratedContent[],
  channel: ChannelType
): 'not_started' | 'in_progress' | 'done' {
  const ch = contents.filter((c) => c.channel === channel);
  if (ch.length === 0) return 'not_started';
  if (ch.every((c) => c.status === 'published')) return 'done';
  return 'in_progress';
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Brand DNA 완성도
  const { calculateCompleteness } = useBrandDNAStore();
  const dnaCompleteness = calculateCompleteness();

  // MVP: 로컬 상태로 콘텐츠 관리 — 추후 API 연동 예정
  const [contents, setContents] = useState<GeneratedContent[]>([]);

  // ── 채널 카드 정의 ──────────────────────────────────────────────────────
  const CHANNEL_CARDS: ChannelCard[] = [
    {
      channel: 'site',
      label: '판매사이트',
      href: `/project/${id}/site`,
      icon: Globe,
      description: '랜딩페이지 및 제품 소개 사이트',
    },
    {
      channel: 'blog',
      label: '블로그',
      href: `/project/${id}/blog`,
      icon: FileText,
      description: 'SEO 최적화 블로그 콘텐츠',
    },
    {
      channel: 'instagram',
      label: '인스타그램',
      href: `/project/${id}/instagram`,
      icon: Instagram,
      description: '피드 이미지 및 캡션',
    },
    {
      channel: 'shortform',
      label: '숏폼',
      href: `/project/${id}/shortform`,
      icon: Video,
      description: '틱톡/릴스 스크립트 및 자막',
    },
  ];

  // ── 집계 통계 ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = contents.length;
    const totalCost = contents.reduce((sum, c) => sum + c.generationCost, 0);
    const totalTokens = contents.reduce((sum, c) => sum + c.tokensUsed, 0);

    const statusCount: Record<ContentStatus, number> = {
      draft: 0,
      approved: 0,
      scheduled: 0,
      published: 0,
    };
    for (const c of contents) {
      statusCount[c.status] += 1;
    }

    const channelCount: Record<ChannelType, number> = {
      site: 0,
      blog: 0,
      instagram: 0,
      shortform: 0,
    };
    for (const c of contents) {
      channelCount[c.channel] += 1;
    }

    return { total, totalCost, totalTokens, statusCount, channelCount };
  }, [contents]);

  // ── 콘텐츠 핸들러 ────────────────────────────────────────────────────────

  function handleApprove(contentId: string) {
    setContents((prev) =>
      prev.map((c) =>
        c.id === contentId ? { ...c, status: 'approved' as ContentStatus } : c
      )
    );
  }

  function handleDelete(contentId: string) {
    setContents((prev) => prev.filter((c) => c.id !== contentId));
  }

  function handleBulkApprove(ids: string[]) {
    const idSet = new Set(ids);
    setContents((prev) =>
      prev.map((c) =>
        idSet.has(c.id) ? { ...c, status: 'approved' as ContentStatus } : c
      )
    );
  }

  function handleBulkDelete(ids: string[]) {
    const idSet = new Set(ids);
    setContents((prev) => prev.filter((c) => !idSet.has(c.id)));
  }

  // 최근 5건
  const recentContents = useMemo(
    () =>
      [...contents]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    [contents]
  );

  // ── 렌더링 ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* 페이지 제목 */}
      <div>
        <h1 className="text-2xl font-bold">프로젝트 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          브랜드 분석과 채널별 콘텐츠 현황을 확인하세요.
        </p>
      </div>

      {/* Brand DNA 카드 */}
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

      {/* 콘텐츠 현황 통계 카드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">콘텐츠 현황</CardTitle>
          </div>
          <CardDescription>생성된 콘텐츠의 채널별 분포 및 비용 요약</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 채널별 수량 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CHANNEL_CARDS.map((ch) => {
              const count = stats.channelCount[ch.channel];
              const Icon = ch.icon;
              return (
                <div
                  key={ch.channel}
                  className="flex flex-col items-center gap-1 rounded-md border bg-muted/30 px-3 py-3"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xl font-bold">{count}</span>
                  <span className="text-xs text-muted-foreground">{ch.label}</span>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* 상태 분포 바 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>상태 분포</span>
              <span>총 {stats.total}건</span>
            </div>
            {stats.total > 0 ? (
              <>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  {(
                    [
                      'draft',
                      'approved',
                      'scheduled',
                      'published',
                    ] as ContentStatus[]
                  ).map((status) => {
                    const pct =
                      stats.total > 0
                        ? (stats.statusCount[status] / stats.total) * 100
                        : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={status}
                        className={`h-full ${CONTENT_STATUS_COLOR[status]}`}
                        style={{ width: `${pct}%` }}
                        title={`${CONTENT_STATUS_LABEL[status]}: ${stats.statusCount[status]}건`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {(
                    [
                      'draft',
                      'approved',
                      'scheduled',
                      'published',
                    ] as ContentStatus[]
                  ).map((status) => {
                    const count = stats.statusCount[status];
                    if (count === 0) return null;
                    return (
                      <div key={status} className="flex items-center gap-1.5">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${CONTENT_STATUS_COLOR[status]}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {CONTENT_STATUS_LABEL[status]} {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-2.5 w-full rounded-full bg-muted" />
            )}
          </div>

          <Separator />

          {/* 비용 + 토큰 요약 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">총 생성 비용</p>
                <p className="text-sm font-semibold">
                  {stats.totalCost === 0
                    ? '$0'
                    : `$${stats.totalCost.toFixed(4)}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">사용 토큰</p>
                <p className="text-sm font-semibold">
                  {stats.totalTokens.toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 채널 카드 그리드 */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">채널</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CHANNEL_CARDS.map((ch) => {
            const Icon = ch.icon;
            const chStatus = getChannelStatus(contents, ch.channel);
            const badge = STATUS_BADGE_CONFIG[chStatus];
            const count = countByChannel(contents, ch.channel);

            return (
              <Link key={ch.channel} href={ch.href} className="group block">
                <Card className="h-full transition-shadow hover:shadow-md group-hover:border-primary/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">{ch.label}</CardTitle>
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
                    <p className="mt-2 text-xs text-muted-foreground">
                      생성된 콘텐츠: {count}건
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 빠른 생성 버튼 */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">빠른 생성</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="default">
            <Link href={`/project/${id}/blog`}>
              <PenLine className="mr-2 h-4 w-4" />
              블로그 생성
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/project/${id}/instagram`}>
              <ImagePlus className="mr-2 h-4 w-4" />
              인스타 생성
            </Link>
          </Button>
        </div>
      </div>

      {/* 최근 콘텐츠 섹션 */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 콘텐츠</h2>
          {contents.length > 5 && (
            <Link
              href={`/project/${id}/blog`}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              전체 보기
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <ContentList
          contents={recentContents}
          showFilters={false}
          onApprove={handleApprove}
          onDelete={handleDelete}
          onBulkApprove={handleBulkApprove}
          onBulkDelete={handleBulkDelete}
        />

        {contents.length === 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            채널 페이지에서 콘텐츠를 생성하면 여기에 표시됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
