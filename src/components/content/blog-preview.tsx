'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface BlogPreviewContent {
  title?: string;
  body: { markdown?: string; html?: string };
  copyStyle?: string;
  tokensUsed?: number;
  generationCost?: number;
}

interface BlogPreviewProps {
  content: BlogPreviewContent | null;
  isLoading?: boolean;
  onApprove?: () => void;
  onRegenerate?: () => void;
}

function BlogPreviewSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        {/* Title skeleton */}
        <Skeleton className="mb-4 h-7 w-3/4" />

        {/* Body paragraph skeletons */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Second paragraph skeletons */}
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-3 border-t pt-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-16" />
        </div>
      </CardFooter>
    </Card>
  );
}

function BlogPreviewEmpty() {
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

export function BlogPreview({
  content,
  isLoading = false,
  onApprove,
  onRegenerate,
}: BlogPreviewProps) {
  if (isLoading) {
    return <BlogPreviewSkeleton />;
  }

  if (!content) {
    return <BlogPreviewEmpty />;
  }

  const { title, body, copyStyle, tokensUsed, generationCost } = content;
  const hasHtml = typeof body.html === 'string' && body.html.trim().length > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Title */}
        {title && (
          <h2 className="mb-4 text-xl font-semibold leading-tight tracking-tight">
            {title}
          </h2>
        )}

        {/* Body */}
        {hasHtml ? (
          // HTML 렌더링 — MVP 단계: sanitize는 추후 DOMPurify 연동 예정
          <div
            className="prose prose-sm max-w-none text-foreground"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: body.html! }}
          />
        ) : body.markdown ? (
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {body.markdown}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">본문 내용이 없습니다.</p>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-wrap items-center gap-3 pt-4">
        {/* 메타 정보 */}
        {copyStyle && (
          <Badge variant="secondary">{copyStyle}</Badge>
        )}

        {typeof tokensUsed === 'number' && (
          <span className="text-xs text-muted-foreground">
            토큰: {tokensUsed.toLocaleString()}
          </span>
        )}

        {typeof generationCost === 'number' && (
          <span className="text-xs text-muted-foreground">
            비용: ${generationCost.toFixed(4)}
          </span>
        )}

        {/* 액션 버튼 */}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            재생성
          </Button>
          <Button size="sm" onClick={onApprove}>
            승인
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
