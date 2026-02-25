'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { BLOG_TYPES } from '@/types/blog';
import type { ContentStatus } from '@/types/content';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BlogPreviewContent {
  title?: string;
  body: { markdown?: string; html?: string };
  copyStyle?: string;
  tokensUsed?: number;
  generationCost?: number;
  createdAt?: string;
}

interface BlogPreviewProps {
  content: BlogPreviewContent | null;
  isLoading?: boolean;
  thumbnailUrl?: string;
  blogType?: string;
  status?: ContentStatus;
  onApprove?: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onViewDetail?: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** HTML 태그를 제거하고 평문 텍스트만 반환 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** 미리보기용 본문 최대 100자 추출 */
function getBodyPreview(body: { markdown?: string; html?: string }): string {
  const raw = body.html ? stripHtml(body.html) : (body.markdown ?? '');
  return raw.length > 100 ? raw.slice(0, 100) + '…' : raw;
}

// ── Status badge ───────────────────────────────────────────────────────────────

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
      return 'secondary'; // green은 커스텀 클래스로 처리
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

// ── Sub-components ─────────────────────────────────────────────────────────────

export function BlogPreviewSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* 썸네일 스켈레톤 */}
          <Skeleton className="h-[105px] w-[200px] shrink-0 rounded-md" />

          {/* 콘텐츠 영역 스켈레톤 */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />

            <div className="mt-auto flex items-center gap-2 pt-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
              <div className="ml-auto flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BlogPreviewEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          아직 생성된 콘텐츠가 없습니다
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          위 버튼을 눌러 브랜드 스토리를 생성해보세요.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function BlogPreview({
  content,
  isLoading = false,
  thumbnailUrl,
  blogType,
  status,
  onApprove,
  onRegenerate,
  onDelete,
  onViewDetail,
}: BlogPreviewProps) {
  if (isLoading) {
    return <BlogPreviewSkeleton />;
  }

  if (!content) {
    return <BlogPreviewEmpty />;
  }

  const { title, body, copyStyle, tokensUsed, generationCost } = content;

  // 블로그 타입 한글 이름 조회
  const blogTypeConfig = blogType
    ? BLOG_TYPES.find((t) => t.id === blogType)
    : undefined;
  const blogTypeLabel = blogTypeConfig?.nameKo ?? blogType;

  const bodyPreview = getBodyPreview(body);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* 썸네일 영역 (200×105 px) */}
          <button
            type="button"
            className="group relative h-[105px] w-[200px] shrink-0 cursor-pointer overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onViewDetail}
            aria-label="블로그 상세 보기"
          >
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt={title ?? '블로그 썸네일'}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  썸네일 없음
                </span>
              </div>
            )}
          </button>

          {/* 콘텐츠 영역 */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {/* 제목 (2줄 clamp) */}
            {title ? (
              <h3
                className="line-clamp-2 cursor-pointer text-sm font-semibold leading-snug hover:underline"
                onClick={onViewDetail}
              >
                {title}
              </h3>
            ) : (
              <p className="text-sm text-muted-foreground">(제목 없음)</p>
            )}

            {/* 본문 미리보기 (3줄 clamp) */}
            {bodyPreview ? (
              <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {bodyPreview}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">본문 내용이 없습니다.</p>
            )}

            <Separator className="my-1" />

            {/* 하단 행: 뱃지 + 메타 + 버튼 */}
            <div className="flex flex-wrap items-center gap-2">
              {/* 블로그 타입 뱃지 */}
              {blogTypeLabel && (
                <Badge variant="outline" className="text-[10px]">
                  {blogTypeLabel}
                </Badge>
              )}

              {/* 상태 뱃지 */}
              {status && (
                <Badge
                  variant={statusBadgeVariant(status)}
                  className={cn('text-[10px]', statusExtraClass(status))}
                >
                  {STATUS_LABEL[status]}
                </Badge>
              )}

              {/* 카피 스타일 */}
              {copyStyle && (
                <Badge variant="secondary" className="text-[10px]">
                  {copyStyle}
                </Badge>
              )}

              {/* 메타 정보 */}
              {typeof tokensUsed === 'number' && (
                <span className="text-[10px] text-muted-foreground">
                  {tokensUsed.toLocaleString()} 토큰
                </span>
              )}
              {typeof generationCost === 'number' && (
                <span className="text-[10px] text-muted-foreground">
                  ${generationCost.toFixed(4)}
                </span>
              )}

              {/* 액션 버튼 */}
              <div className="ml-auto flex shrink-0 gap-1.5">
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
