'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { BLOG_TYPES } from '@/types/blog';
import type { BlogPreviewContent } from '@/components/content/blog-preview';

// ── Types ──────────────────────────────────────────────────────────────────────

interface BlogDetailModalProps {
  content: BlogPreviewContent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thumbnailUrl?: string;
  blogType?: string;
  status?: string;
  onApprove?: () => void;
  onRegenerate?: () => void;
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  draft: '초안',
  approved: '승인됨',
  scheduled: '예약됨',
  published: '발행됨',
};

function statusClass(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-primary text-primary-foreground';
    case 'published':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'scheduled':
      return 'border-border text-foreground';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
}

// ── Copy style label map ───────────────────────────────────────────────────────

const COPY_STYLE_LABEL: Record<string, string> = {
  ogilvy: 'David Ogilvy',
  burnett: 'Leo Burnett',
  bernbach: 'Bill Bernbach',
  clow: 'Lee Clow',
  lee_jeseok: '이제석 스타일',
  brunch_essay: '브런치 에세이',
  kurly: '마켓컬리 스타일',
  editorial: '무신사/29CM 에디토리얼',
};

// ── Component ──────────────────────────────────────────────────────────────────

export function BlogDetailModal({
  content,
  open,
  onOpenChange,
  thumbnailUrl,
  blogType,
  status,
  onApprove,
  onRegenerate,
}: BlogDetailModalProps) {
  // 블로그 타입 한글 이름 조회
  const blogTypeConfig = blogType
    ? BLOG_TYPES.find((t) => t.id === blogType)
    : undefined;
  const blogTypeLabel = blogTypeConfig?.nameKo ?? blogType;

  const hasContent = content !== null;
  const hasHtml =
    hasContent &&
    typeof content.body.html === 'string' &&
    content.body.html.trim().length > 0;

  // createdAt 포맷
  const formattedDate =
    hasContent && content.createdAt
      ? new Date(content.createdAt).toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* max-w-3xl, 화면 높이 90% 이내 스크롤 */}
      <DialogContent
        className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0"
        showCloseButton
      >
        {/* ── 썸네일 헤더 ──────────────────────────────────────────────────── */}
        <div className="relative max-h-[220px] w-full shrink-0 overflow-hidden bg-muted">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt={content?.title ?? '블로그 썸네일'}
              className="h-full max-h-[220px] w-full object-cover"
            />
          ) : (
            <div className="flex h-[120px] items-center justify-center">
              <span className="text-sm text-muted-foreground">
                썸네일 이미지 없음
              </span>
            </div>
          )}
        </div>

        {/* ── 타이틀 섹션 ──────────────────────────────────────────────────── */}
        <DialogHeader className="shrink-0 px-6 pt-5 pb-3">
          {/* 블로그 타입 뱃지 + 상태 뱃지 */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {blogTypeLabel && (
              <Badge variant="outline" className="text-xs">
                {blogTypeLabel}
              </Badge>
            )}
            {status && (
              <Badge className={cn('border text-xs', statusClass(status))}>
                {STATUS_LABEL[status] ?? status}
              </Badge>
            )}
          </div>

          <DialogTitle className="text-xl leading-snug">
            {content?.title ?? '(제목 없음)'}
          </DialogTitle>
        </DialogHeader>

        <Separator />

        {/* ── 본문 영역 (스크롤) ────────────────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {!hasContent ? (
            <p className="text-sm text-muted-foreground">
              콘텐츠가 없습니다.
            </p>
          ) : hasHtml ? (
            // HTML 렌더링 — MVP 단계: sanitize는 추후 DOMPurify 연동 예정
            <div
              className="prose prose-sm max-w-none text-foreground"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: content.body.html! }}
            />
          ) : content.body.markdown ? (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {content.body.markdown}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              본문 내용이 없습니다.
            </p>
          )}
        </div>

        <Separator />

        {/* ── 메타 정보 ─────────────────────────────────────────────────────── */}
        <div className="shrink-0 px-6 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {content?.copyStyle && (
              <span>
                카피 스타일:{' '}
                <strong className="font-medium text-foreground">
                  {COPY_STYLE_LABEL[content.copyStyle] ?? content.copyStyle}
                </strong>
              </span>
            )}
            {typeof content?.tokensUsed === 'number' && (
              <span>
                사용 토큰:{' '}
                <strong className="font-medium text-foreground">
                  {content.tokensUsed.toLocaleString()}
                </strong>
              </span>
            )}
            {typeof content?.generationCost === 'number' && (
              <span>
                생성 비용:{' '}
                <strong className="font-medium text-foreground">
                  ${content.generationCost.toFixed(4)}
                </strong>
              </span>
            )}
            {formattedDate && (
              <span>
                생성일:{' '}
                <strong className="font-medium text-foreground">
                  {formattedDate}
                </strong>
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* ── 푸터 버튼 ─────────────────────────────────────────────────────── */}
        <DialogFooter className="shrink-0 px-6 py-4">
          {onRegenerate && (
            <Button
              variant="outline"
              onClick={() => {
                onRegenerate();
                onOpenChange(false);
              }}
            >
              재생성
            </Button>
          )}
          {onApprove && (
            <Button
              onClick={() => {
                onApprove();
                onOpenChange(false);
              }}
            >
              승인
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="ghost">닫기</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
