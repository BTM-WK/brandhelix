'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { BlogTypeSelector } from '@/components/content/blog-type-selector';
import { BlogPreview } from '@/components/content/blog-preview';
import { useBrandDNAStore } from '@/stores/brand-dna-store';
import { BLOG_TYPES } from '@/types/blog';
import type { BlogType } from '@/types/blog';
import type { BrandDNA } from '@/types/brand-dna';
import type { GeneratedContent } from '@/types/content';

interface BlogPageProps {
  params: Promise<{ id: string }>;
}

interface Competitor {
  name: string;
  websiteUrl: string;
}

// API 응답에서 BlogPreview에 넘길 콘텐츠 형태로 변환
function extractPreviewContent(content: GeneratedContent): {
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

  // 폼 상태
  const [selectedType, setSelectedType] = useState<BlogType | null>(null);
  const [keywords, setKeywords] = useState('');
  const [productName, setProductName] = useState('');
  const [seriesNumber, setSeriesNumber] = useState(1);
  const [competitors, setCompetitors] = useState<Competitor[]>([{ name: '', websiteUrl: '' }]);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 생성된 콘텐츠 목록
  const [contents, setContents] = useState<GeneratedContent[]>([]);

  // 선택된 블로그 타입 설정값 조회
  const selectedTypeConfig = selectedType
    ? BLOG_TYPES.find((t) => t.id === selectedType) ?? null
    : null;

  // 경쟁사 입력 핸들러
  const handleCompetitorChange = useCallback(
    (index: number, field: keyof Competitor, value: string) => {
      setCompetitors((prev) =>
        prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
      );
    },
    []
  );

  const handleAddCompetitor = useCallback(() => {
    setCompetitors((prev) => {
      if (prev.length >= 2) return prev;
      return [...prev, { name: '', websiteUrl: '' }];
    });
  }, []);

  const handleRemoveCompetitor = useCallback((index: number) => {
    setCompetitors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 승인 핸들러
  const handleApprove = useCallback((contentId: string) => {
    setContents((prev) =>
      prev.map((c) => (c.id === contentId ? { ...c, status: 'approved' as const } : c))
    );
    toast.success('콘텐츠가 승인되었습니다.');
  }, []);

  // 블로그 생성 요청
  const handleGenerate = useCallback(async () => {
    if (!selectedType) return;

    setIsGenerating(true);

    const now = new Date().toISOString();

    const brandDNA: BrandDNA = {
      id: 'temp',
      projectId,
      layers,
      completenessScore: completeness,
      createdAt: now,
      updatedAt: now,
    };

    const parsedKeywords = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const copyStyle =
      layers.verbalIdentity?.copyStyle ?? layers.creativeStyle?.copyStyle ?? undefined;

    // 경쟁사: 빈 항목 제거
    const filteredCompetitors = competitors.filter((c) => c.name.trim() !== '');

    try {
      const response = await fetch('/api/generate/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          blogType: selectedType,
          keywords: parsedKeywords,
          productName: productName.trim() || undefined,
          copyStyle,
          seriesNumber: selectedType === 'science_series' ? seriesNumber : undefined,
          competitors: selectedType === 'comparison_guide' ? filteredCompetitors : undefined,
          additionalPrompt: additionalPrompt.trim() || undefined,
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

      // 임시 ID 보장 (서버에서 반환하지 않는 경우 대비)
      const newContent: GeneratedContent = {
        ...json.data,
        id: json.data.id || nanoid(),
      };

      // 최신 항목을 맨 앞에 추가
      setContents((prev) => [newContent, ...prev]);
      toast.success('블로그 콘텐츠가 생성되었습니다.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedType,
    projectId,
    layers,
    completeness,
    keywords,
    productName,
    seriesNumber,
    competitors,
    additionalPrompt,
  ]);

  const isGenerateDisabled = !selectedType || completeness < 25 || isGenerating;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">블로그 콘텐츠</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Brand DNA 기반 5종 블로그 타입 중 선택하여 AI가 콘텐츠를 생성합니다.
        </p>
      </div>

      {/* 2. Brand DNA 미완성 경고 */}
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

      {/* 3. 블로그 타입 선택 */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold">블로그 타입 선택</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            생성할 블로그 콘텐츠의 유형을 선택하세요.
          </p>
        </div>
        <BlogTypeSelector selectedType={selectedType} onSelect={setSelectedType} />
      </div>

      {/* 선택된 타입 상세 정보 */}
      {selectedTypeConfig && (
        <Card className="border-primary/20 bg-primary/3">
          <CardHeader className="pb-3 pt-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">
                {selectedTypeConfig.nameKo}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {selectedTypeConfig.name}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {selectedTypeConfig.purposeKo}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {/* 구성 섹션 */}
              <div>
                <span className="font-medium text-foreground">구성: </span>
                {selectedTypeConfig.structure.join(' → ')}
              </div>
              {/* 이미지 스펙 */}
              <div>
                <span className="font-medium text-foreground">이미지: </span>
                {selectedTypeConfig.imageSpec.width} × {selectedTypeConfig.imageSpec.height}px,{' '}
                {selectedTypeConfig.imageSpec.count}장
              </div>
              {/* 글자 수 */}
              <div>
                <span className="font-medium text-foreground">분량: </span>
                {selectedTypeConfig.lengthRange.min.toLocaleString()}~
                {selectedTypeConfig.lengthRange.max.toLocaleString()}자
              </div>
            </div>
            {/* 제목 규칙 */}
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">제목 규칙: </span>
              {selectedTypeConfig.titleRule}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 4. 생성 폼 (타입 선택 후 표시) */}
      {selectedType && (
        <Card>
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-sm font-semibold">생성 옵션</CardTitle>
            <CardDescription className="text-xs">
              키워드와 추가 정보를 입력하면 더 정확한 콘텐츠가 생성됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-5">
            {/* 키워드 입력 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="keywords" className="text-xs font-medium">
                키워드 <span className="text-muted-foreground">(필수)</span>
              </Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="키워드를 쉼표로 구분하여 입력 (예: 세럼, 피부관리, 보습)"
                className="text-sm"
              />
              {keywords.trim() && (
                <div className="flex flex-wrap gap-1">
                  {keywords
                    .split(',')
                    .map((k) => k.trim())
                    .filter(Boolean)
                    .map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                </div>
              )}
            </div>

            {/* 제품명 입력 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-name" className="text-xs font-medium">
                제품명 <span className="text-muted-foreground">(선택)</span>
              </Label>
              <Input
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="특정 제품명을 입력하세요 (예: 레티놀 앰플 세럼)"
                className="text-sm"
              />
            </div>

            {/* science_series 전용: 시리즈 번호 */}
            {selectedType === 'science_series' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="series-number" className="text-xs font-medium">
                  시리즈 번호
                </Label>
                <Input
                  id="series-number"
                  type="number"
                  min={1}
                  max={99}
                  value={seriesNumber}
                  onChange={(e) => setSeriesNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-24 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  연재 시리즈의 회차를 입력하세요.
                </p>
              </div>
            )}

            {/* comparison_guide 전용: 경쟁사 입력 */}
            {selectedType === 'comparison_guide' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    비교 대상 경쟁사{' '}
                    <span className="text-muted-foreground">(최대 2개)</span>
                  </Label>
                  {competitors.length < 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAddCompetitor}
                      className="h-7 gap-1 px-2 text-xs"
                    >
                      <Plus className="size-3" />
                      추가
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {competitors.map((competitor, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:gap-2">
                        <Input
                          value={competitor.name}
                          onChange={(e) =>
                            handleCompetitorChange(index, 'name', e.target.value)
                          }
                          placeholder={`경쟁사 ${index + 1} 이름`}
                          className="text-sm"
                        />
                        <Input
                          value={competitor.websiteUrl}
                          onChange={(e) =>
                            handleCompetitorChange(index, 'websiteUrl', e.target.value)
                          }
                          placeholder="웹사이트 URL (선택)"
                          className="text-sm"
                        />
                      </div>
                      {competitors.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCompetitor(index)}
                          className="mt-0.5 size-9 shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={`경쟁사 ${index + 1} 삭제`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 추가 프롬프트 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="additional-prompt" className="text-xs font-medium">
                추가 요청사항 <span className="text-muted-foreground">(선택)</span>
              </Label>
              <Textarea
                id="additional-prompt"
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                placeholder="AI에게 추가로 전달할 내용을 입력하세요 (톤 지시, 특별 강조 포인트 등)"
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <Separator />

            {/* 생성 버튼 */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => void handleGenerate()}
                disabled={isGenerateDisabled}
                className="min-w-24"
              >
                {isGenerating ? '생성 중...' : '생성하기'}
              </Button>
              {completeness < 25 && (
                <p className="text-xs text-muted-foreground">
                  Brand DNA 완성도 25% 이상이 필요합니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. 생성된 콘텐츠 목록 */}
      <div className="flex flex-col gap-3">
        {contents.length > 0 && (
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">생성된 콘텐츠</h2>
            <Badge variant="secondary" className="text-xs">
              {contents.length}개
            </Badge>
          </div>
        )}

        {isGenerating && contents.length === 0 ? (
          // 첫 생성 중: 스켈레톤 미리보기 표시
          <BlogPreview content={null} isLoading={true} />
        ) : contents.length === 0 ? (
          // 빈 상태
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                아직 생성된 콘텐츠가 없습니다
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                블로그 타입을 선택하고 생성하기 버튼을 눌러보세요.
              </p>
            </CardContent>
          </Card>
        ) : (
          // 생성된 콘텐츠 카드 목록
          <div className="flex flex-col gap-4">
            {contents.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-1">
                {/* 순번 + 타입 레이블 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    #{contents.length - index}
                  </span>
                  {item.contentType && (
                    <Badge variant="outline" className="text-xs">
                      {BLOG_TYPES.find((t) => t.id === item.contentType)?.nameKo ??
                        item.contentType}
                    </Badge>
                  )}
                  {item.status === 'approved' && (
                    <Badge className="text-xs">승인됨</Badge>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* isGenerating이고 첫 번째 항목이면 로딩 표시 (재생성 시) */}
                <BlogPreview
                  content={extractPreviewContent(item)}
                  isLoading={isGenerating && index === 0}
                  onApprove={() => handleApprove(item.id)}
                  onRegenerate={() => void handleGenerate()}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
