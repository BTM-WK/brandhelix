'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SHORTFORM_TYPES } from '@/types/shortform';
import type { ContentStatus } from '@/types/content';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ShortformPreviewScene {
  sceneNumber: number;
  duration: string;
  narration: string;
  visualDescription: string;
  textOverlay?: string;
  transition?: string;
}

export interface ShortformPreviewContent {
  hookLine: string;
  title: string;
  scenes: ShortformPreviewScene[];
  cta: string;
  subtitles: string[];
  hashtags: string[];
  bgmSuggestion?: string;
  totalDuration: string;
  platform: string;
  // Meta
  tokensUsed?: number;
  generationCost?: number;
}

interface ShortformPreviewProps {
  content: ShortformPreviewContent | null;
  thumbnailUrl?: string;
  isLoading?: boolean;
  shortformType?: string;
  status?: ContentStatus;
  onApprove?: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onViewDetail?: () => void;
}

// ── Status helpers (same pattern as blog-preview) ─────────────────────────────

const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: '초안',
  approved: '승인됨',
  scheduled: '예약됨',
  published: '발행됨',
};

type BadgeVariant = 'secondary' | 'default' | 'outline';

function statusBadgeVariant(status: ContentStatus): BadgeVariant {
  switch (status) {
    case 'draft':
      return 'secondary';
    case 'approved':
      return 'default';
    case 'scheduled':
      return 'outline';
    case 'published':
      return 'secondary';
    default:
      return 'secondary';
  }
}

function statusExtraClass(status: ContentStatus): string {
  if (status === 'published') {
    return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
  }
  return '';
}

// ── Sub-components ────────────────────────────────────────────────────────────

export function ShortformPreviewSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-2/3" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <Skeleton className="mt-2 h-4 w-full" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pb-5">
        {/* Thumbnail skeleton */}
        <Skeleton className="h-[160px] w-[90px] self-center rounded-lg" />
        {/* Scene skeletons */}
        <div className="relative pl-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-4">
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ))}
        </div>
        {/* Hashtag skeleton */}
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-5 w-16" />
          ))}
        </div>
        {/* Action buttons skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ShortformPreviewEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          아직 생성된 스크립트가 없습니다
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          위 버튼을 눌러 숏폼 스크립트를 생성해보세요.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ShortformPreview({
  content,
  thumbnailUrl,
  isLoading = false,
  shortformType,
  status,
  onApprove,
  onRegenerate,
  onDelete,
  onViewDetail,
}: ShortformPreviewProps) {
  if (isLoading) {
    return <ShortformPreviewSkeleton />;
  }

  if (!content) {
    return <ShortformPreviewEmpty />;
  }

  const {
    hookLine,
    title,
    scenes,
    cta,
    subtitles,
    hashtags,
    bgmSuggestion,
    totalDuration,
    platform,
    tokensUsed,
    generationCost,
  } = content;

  // 숏폼 타입 한글 이름 조회
  const typeConfig = shortformType
    ? SHORTFORM_TYPES.find((t) => t.id === shortformType)
    : undefined;
  const typeLabel = typeConfig?.nameKo ?? shortformType;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3 pt-4">
        {/* Header row: title + meta badges */}
        <div className="flex items-start justify-between gap-2">
          <CardTitle
            className={cn(
              'line-clamp-2 text-sm font-semibold leading-snug',
              onViewDetail && 'cursor-pointer hover:underline',
            )}
            onClick={onViewDetail}
          >
            {title || '(제목 없음)'}
          </CardTitle>
          <div className="flex shrink-0 gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {totalDuration}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {platform}
            </Badge>
          </div>
        </div>

        {/* Hook line -- primary emphasis */}
        <p className="mt-1.5 text-sm font-medium leading-snug text-primary">
          {hookLine}
        </p>

        {/* Type + status badges row */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {typeLabel && (
            <Badge variant="outline" className="text-[10px]">
              {typeLabel}
            </Badge>
          )}
          {status && (
            <Badge
              variant={statusBadgeVariant(status)}
              className={cn('text-[10px]', statusExtraClass(status))}
            >
              {STATUS_LABEL[status]}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pb-5">
        {/* ── Thumbnail (if provided) ─────────────────────────────────────── */}
        {thumbnailUrl && (
          <div className="flex justify-center">
            <button
              type="button"
              className="group relative h-[160px] w-[90px] shrink-0 cursor-pointer overflow-hidden rounded-lg bg-muted shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onViewDetail}
              aria-label="숏폼 썸네일 상세 보기"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailUrl}
                alt={title ?? '숏폼 썸네일'}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </button>
          </div>
        )}

        {/* ── Scene timeline ──────────────────────────────────────────────── */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            씬 스크립트 ({scenes.length}개)
          </p>

          <div className="relative pl-8">
            {/* Timeline vertical line */}
            <div className="absolute left-3 top-0 h-full w-0.5 bg-border" />

            {scenes.map((scene, idx) => (
              <div key={`scene-${scene.sceneNumber}-${idx}`} className="relative mb-4 last:mb-0">
                {/* Timeline dot */}
                <div className="absolute -left-5 top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />

                {/* Scene card */}
                <Card className="ml-2 shadow-none">
                  <CardContent className="p-3">
                    {/* Scene header badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <Badge variant="default" className="text-[10px]">
                        씬 {scene.sceneNumber}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {scene.duration}
                      </Badge>
                      {scene.transition && (
                        <Badge variant="secondary" className="text-[10px]">
                          {scene.transition}
                        </Badge>
                      )}
                    </div>

                    {/* Narration */}
                    <p className="text-sm font-medium leading-relaxed">
                      {scene.narration}
                    </p>

                    {/* Visual description */}
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      <span className="font-medium">화면:</span> {scene.visualDescription}
                    </p>

                    {/* Text overlay */}
                    {scene.textOverlay && (
                      <p className="mt-1 text-xs leading-relaxed text-primary">
                        <span className="font-medium">오버레이:</span> {scene.textOverlay}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* ── CTA section ─────────────────────────────────────────────────── */}
        {cta && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">CTA</p>
            <p className="mt-1 text-sm font-semibold text-primary">{cta}</p>
          </div>
        )}

        {/* ── Subtitles section ───────────────────────────────────────────── */}
        {subtitles.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              자막 ({subtitles.length}개)
            </p>
            <div className="flex flex-col gap-1">
              {subtitles.map((sub, idx) => (
                <div
                  key={`sub-${idx}`}
                  className="flex items-start gap-2 text-xs leading-relaxed"
                >
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-foreground">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Hashtags section ────────────────────────────────────────────── */}
        {hashtags.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">해시태그</p>
            <div className="flex flex-wrap gap-1">
              {hashtags.map((tag, idx) => (
                <Badge
                  key={`tag-${idx}`}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── BGM suggestion ──────────────────────────────────────────────── */}
        {bgmSuggestion && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">추천 BGM</p>
            <p className="mt-1 text-xs text-foreground">{bgmSuggestion}</p>
          </div>
        )}

        <Separator />

        {/* ── Meta section ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <span>{platform}</span>
          <span>{totalDuration}</span>
          {typeof tokensUsed === 'number' && (
            <span>{tokensUsed.toLocaleString()} 토큰</span>
          )}
          {typeof generationCost === 'number' && (
            <span>${generationCost.toFixed(4)}</span>
          )}
        </div>

        {/* ── Action buttons ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-1.5">
          {onViewDetail && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onViewDetail}
            >
              보기
            </Button>
          )}
          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onRegenerate}
            >
              재생성
            </Button>
          )}
          {onApprove && (
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onApprove}
            >
              승인
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
            >
              삭제
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
