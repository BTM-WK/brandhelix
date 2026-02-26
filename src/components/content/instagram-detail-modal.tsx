'use client';

import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { INSTAGRAM_TYPES } from '@/types/instagram';
import {
  InstagramCarouselPreview,
  type CarouselSlide,
} from '@/components/content/instagram-carousel-preview';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface InstagramDetailContent {
  images: Array<{
    imageBase64: string;
    slideNumber: number;
    width: number;
    height: number;
  }>;
  caption?: string;
  hookLine?: string;
  cta?: string;
  hashtags?: string[];
  type?: string; // InstagramType
  status?: string;
  designTone?: string;
  tokensUsed?: number;
  generationCost?: number;
  createdAt?: string;
}

interface InstagramDetailModalProps {
  content: InstagramDetailContent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: () => void;
  onRegenerate?: () => void;
}

// ── Label maps ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  draft: '초안',
  approved: '승인됨',
  scheduled: '예약됨',
  published: '발행됨',
};

const DESIGN_TONE_LABEL: Record<string, string> = {
  modern_minimal: '모던 미니멀',
  natural_organic: '내추럴 오가닉',
  clinical_science: '클리니컬 사이언스',
  premium_luxury: '프리미엄 럭셔리',
  friendly_casual: '친근 캐주얼',
  bold_energetic: '볼드 에너제틱',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusClass(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-primary text-primary-foreground border-transparent';
    case 'published':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'scheduled':
      return 'border-border text-foreground';
    default:
      return 'bg-secondary text-secondary-foreground border-transparent';
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InstagramDetailModal({
  content,
  open,
  onOpenChange,
  onApprove,
  onRegenerate,
}: InstagramDetailModalProps) {
  if (!content) return null;

  // 인스타그램 타입 한글 이름 조회
  const instagramTypeConfig = content.type
    ? INSTAGRAM_TYPES.find((t) => t.id === content.type)
    : undefined;
  const typeLabel = instagramTypeConfig?.nameKo ?? content.type;

  // 이미지를 CarouselSlide 배열로 변환
  const slides: CarouselSlide[] = content.images.map((img) => ({
    imageBase64: img.imageBase64,
    slideNumber: img.slideNumber,
    width: img.width,
    height: img.height,
  }));

  // createdAt 포맷
  const formattedDate = content.createdAt
    ? new Date(content.createdAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // 해시태그 정규화: '#' 접두사 없는 항목에만 추가
  const normalizedHashtags = (content.hashtags ?? []).map((tag) =>
    tag.startsWith('#') ? tag : `#${tag}`
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0"
        showCloseButton
      >
        {/* ── 모달 헤더 (타이틀 접근성용, 시각적으로 숨김) ──────────────────── */}
        <DialogHeader className="sr-only">
          <DialogTitle>인스타그램 포스트 상세</DialogTitle>
        </DialogHeader>

        {/* ── 본문 레이아웃 ────────────────────────────────────────────────── */}
        {/*  - 데스크탑: 좌(60%) 캐러셀 + 우(40%) 상세 패널  */}
        {/*  - 모바일:   위 캐러셀 + 아래 상세 패널 (세로 스택)  */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">

          {/* ── 좌측 — 캐러셀 영역 (60%) ──────────────────────────────────── */}
          <div className="flex shrink-0 items-start justify-center bg-black p-4 md:w-[60%] md:p-6">
            <div className="w-full max-w-sm">
              <InstagramCarouselPreview
                slides={slides}
                aspectRatio="4:5"
                showControls
              />
            </div>
          </div>

          {/* ── 모바일 구분선 ─────────────────────────────────────────────── */}
          <Separator className="md:hidden" />

          {/* ── 우측 — 상세 정보 패널 (40%) ──────────────────────────────── */}
          <div className="flex min-h-0 flex-col overflow-hidden md:w-[40%]">

            {/* ── 타입 / 상태 배지 헤더 ───────────────────────────────────── */}
            <div className="shrink-0 px-5 pt-5 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                {typeLabel && (
                  <Badge variant="outline" className="text-xs">
                    {typeLabel}
                  </Badge>
                )}
                {content.status && (
                  <Badge
                    className={cn('border text-xs', statusClass(content.status))}
                  >
                    {STATUS_LABEL[content.status] ?? content.status}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* ── 스크롤 가능 본문 영역 ───────────────────────────────────── */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">

              {/* 캡션 섹션 */}
              {(content.hookLine || content.caption || content.cta) && (
                <div className="mb-4 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    캡션
                  </h3>
                  {/* 훅 라인 (굵게 강조) */}
                  {content.hookLine && (
                    <p className="text-sm font-semibold leading-snug text-foreground">
                      {content.hookLine}
                    </p>
                  )}
                  {/* 본문 캡션 */}
                  {content.caption && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {content.caption}
                    </p>
                  )}
                  {/* CTA (포인트 색상) */}
                  {content.cta && (
                    <p className="text-sm font-medium text-primary">
                      {content.cta}
                    </p>
                  )}
                </div>
              )}

              {/* 해시태그 */}
              {normalizedHashtags.length > 0 && (
                <>
                  <Separator className="my-3" />
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      해시태그
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {normalizedHashtags.map((tag, idx) => (
                        <Badge
                          key={`${tag}-${idx}`}
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 메타 정보 */}
              {(content.designTone ||
                typeof content.tokensUsed === 'number' ||
                typeof content.generationCost === 'number' ||
                formattedDate) && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-1">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      메타 정보
                    </h3>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                      {content.designTone && (
                        <>
                          <dt className="text-muted-foreground">디자인 톤</dt>
                          <dd className="font-medium text-foreground">
                            {DESIGN_TONE_LABEL[content.designTone] ??
                              content.designTone}
                          </dd>
                        </>
                      )}
                      {typeof content.tokensUsed === 'number' && (
                        <>
                          <dt className="text-muted-foreground">사용 토큰</dt>
                          <dd className="font-medium text-foreground">
                            {content.tokensUsed.toLocaleString()}
                          </dd>
                        </>
                      )}
                      {typeof content.generationCost === 'number' && (
                        <>
                          <dt className="text-muted-foreground">생성 비용</dt>
                          <dd className="font-medium text-foreground">
                            ${content.generationCost.toFixed(4)}
                          </dd>
                        </>
                      )}
                      {formattedDate && (
                        <>
                          <dt className="text-muted-foreground">생성일</dt>
                          <dd className="font-medium text-foreground">
                            {formattedDate}
                          </dd>
                        </>
                      )}
                    </dl>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* ── 액션 버튼 푸터 ────────────────────────────────────────────── */}
            <DialogFooter className="shrink-0 px-5 py-4">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
