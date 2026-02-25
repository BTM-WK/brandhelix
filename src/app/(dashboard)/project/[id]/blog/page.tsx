'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BlogPreview } from '@/components/content/blog-preview';
import { useBrandDNAStore } from '@/stores/brand-dna-store';
import type { BrandDNA } from '@/types/brand-dna';
import type { GeneratedContent } from '@/types/content';

interface BlogPageProps {
  params: Promise<{ id: string }>;
}

// API 응답에서 BlogPreview에 넘길 콘텐츠 형태로 변환
function extractPreviewContent(
  content: GeneratedContent
): {
  title?: string;
  body: { markdown?: string; html?: string };
  copyStyle?: string;
  tokensUsed: number;
  generationCost: number;
} {
  const body = content.body as { markdown?: string; html?: string };
  return {
    title: content.title,
    body,
    copyStyle: content.copyStyle,
    tokensUsed: content.tokensUsed,
    generationCost: content.generationCost,
  };
}

export default function BlogPage({ params }: BlogPageProps) {
  const { id: projectId } = use(params);

  const { layers, calculateCompleteness } = useBrandDNAStore();
  const completeness = calculateCompleteness();

  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);

  // Brand DNA 생성 요청
  const handleGenerate = useCallback(async () => {
    setIsLoading(true);

    const now = new Date().toISOString();

    const brandDNA: BrandDNA = {
      id: 'temp',
      projectId,
      layers,
      completenessScore: completeness,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          input: {
            projectId,
            channel: 'blog',
            contentType: 'brand_story',
          },
        }),
      });

      const json = (await response.json()) as {
        data: GeneratedContent | null;
        error: string | null;
      };

      if (!response.ok || json.error) {
        throw new Error(json.error ?? `서버 오류 (${response.status})`);
      }

      if (!json.data) {
        throw new Error('콘텐츠 데이터가 없습니다.');
      }

      setContent(json.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, layers, completeness]);

  const handleApprove = useCallback(() => {
    toast.success('콘텐츠가 승인되었습니다.');
  }, []);

  const handleRegenerate = useCallback(() => {
    void handleGenerate();
  }, [handleGenerate]);

  return (
    <div className="flex flex-col gap-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">블로그 콘텐츠</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Brand DNA를 기반으로 브랜드 스토리 블로그 포스트를 AI가 생성합니다.
        </p>
      </div>

      {/* Brand DNA 미완성 경고 */}
      {completeness < 25 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="flex items-start gap-3 pt-5">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium">Brand DNA를 먼저 입력해주세요</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                정확한 콘텐츠 생성을 위해 Brand DNA 완성도가 25% 이상이어야 합니다.
                현재 완성도: {completeness}%
              </p>
              <Link
                href={`/project/${projectId}/brand-dna`}
                className="mt-2 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Brand DNA 입력하러 가기 →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 생성 버튼 */}
      <div>
        <Button
          onClick={() => void handleGenerate()}
          disabled={isLoading || completeness < 25}
        >
          {isLoading ? '생성 중...' : '브랜드 스토리 생성'}
        </Button>
      </div>

      {/* 블로그 미리보기 */}
      <BlogPreview
        content={content ? extractPreviewContent(content) : null}
        isLoading={isLoading}
        onApprove={handleApprove}
        onRegenerate={handleRegenerate}
      />
    </div>
  );
}
