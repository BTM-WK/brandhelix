'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { AlertCircle, ImageIcon, Type } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { InstagramTypeSelector } from '@/components/content/instagram-type-selector';
import { useBrandDNAStore } from '@/stores/brand-dna-store';
import { INSTAGRAM_TYPES } from '@/types/instagram';
import type { InstagramType } from '@/types/instagram';
import type { BrandDNA } from '@/types/brand-dna';
import type { GeneratedContent } from '@/types/content';

interface InstagramPageProps {
  params: Promise<{ id: string }>;
}

interface GeneratedImage {
  imageBase64: string;
  slideNumber: number;
}

interface GeneratedCaption {
  caption: string;
  hashtags: string[];
  hookLine: string;
  cta: string;
}

interface InstagramResult {
  id: string;
  contentType: InstagramType;
  images: GeneratedImage[];
  caption: GeneratedCaption | null;
  status: 'draft' | 'approved';
  createdAt: string;
}

export default function InstagramPage({ params }: InstagramPageProps) {
  const { id: projectId } = use(params);

  const { layers, calculateCompleteness } = useBrandDNAStore();
  const completeness = calculateCompleteness();

  // 타입 선택
  const [selectedType, setSelectedType] = useState<InstagramType | null>(null);

  // 공통 폼 필드
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [productName, setProductName] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [keywords, setKeywords] = useState('');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [slideCount, setSlideCount] = useState(1);

  // 타입별 전용 필드
  const [steps, setSteps] = useState(''); // routine_guide — 쉼표 구분
  const [beforeText, setBeforeText] = useState(''); // before_after
  const [afterText, setAfterText] = useState('');   // before_after
  const [eventTitle, setEventTitle] = useState('');  // event_promo
  const [eventDate, setEventDate] = useState('');    // event_promo
  const [eventDiscount, setEventDiscount] = useState(''); // event_promo

  // 생성 상태
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  // 생성 결과 목록
  const [results, setResults] = useState<InstagramResult[]>([]);

  // 선택된 타입 설정 조회
  const selectedTypeConfig = selectedType
    ? INSTAGRAM_TYPES.find((t) => t.id === selectedType) ?? null
    : null;

  // slideCount 범위 클램프
  const handleSlideCountChange = useCallback(
    (value: string) => {
      if (!selectedTypeConfig) return;
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) return;
      const clamped = Math.min(
        selectedTypeConfig.slideCount.max,
        Math.max(selectedTypeConfig.slideCount.min, parsed)
      );
      setSlideCount(clamped);
    },
    [selectedTypeConfig]
  );

  // 타입 선택 시 slideCount를 해당 타입의 min으로 초기화
  const handleTypeSelect = useCallback((type: InstagramType) => {
    setSelectedType(type);
    const config = INSTAGRAM_TYPES.find((t) => t.id === type);
    if (config) {
      setSlideCount(config.slideCount.min);
    }
  }, []);

  // 승인 핸들러
  const handleApprove = useCallback((resultId: string) => {
    setResults((prev) =>
      prev.map((r) => (r.id === resultId ? { ...r, status: 'approved' as const } : r))
    );
    toast.success('콘텐츠가 승인되었습니다.');
  }, []);

  // 공통 BrandDNA 빌드
  const buildBrandDNA = useCallback((): BrandDNA => {
    const now = new Date().toISOString();
    return {
      id: 'temp',
      projectId,
      layers,
      completenessScore: completeness,
      createdAt: now,
      updatedAt: now,
    };
  }, [projectId, layers, completeness]);

  // 이미지 생성
  const handleGenerateImage = useCallback(async () => {
    if (!selectedType || !selectedTypeConfig) return;

    setIsGeneratingImage(true);

    const brandDNA = buildBrandDNA();
    const parsedKeywords = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const designTone =
      layers.visualIdentity?.designTone ??
      layers.creativeStyle?.designTone ??
      'modern_minimal';

    const brandName =
      layers.brandCore?.brandName ??
      layers.companyIdentity?.companyName ??
      '';

    // 타입별 content 페이로드 구성
    const contentPayload: Record<string, unknown> = {
      type: selectedType,
      title: title.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      productName: productName.trim() || undefined,
      keywords: parsedKeywords,
      slideCount,
    };

    if (
      selectedType === 'info_card_carousel' ||
      selectedType === 'brand_mood'
    ) {
      contentPayload.body = bodyText.trim() || undefined;
    }

    if (selectedType === 'routine_guide') {
      const parsedSteps = steps
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      contentPayload.steps = parsedSteps;
    }

    if (selectedType === 'before_after') {
      contentPayload.beforeText = beforeText.trim() || undefined;
      contentPayload.afterText = afterText.trim() || undefined;
    }

    if (selectedType === 'event_promo') {
      contentPayload.eventTitle = eventTitle.trim() || undefined;
      contentPayload.eventDate = eventDate.trim() || undefined;
      contentPayload.discount = eventDiscount.trim() || undefined;
    }

    try {
      const response = await fetch('/api/images/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          type: selectedType,
          content: contentPayload,
          designTone,
          brandName,
          slideCount,
        }),
      });

      const json = (await response.json()) as {
        data: { images: GeneratedImage[] } | null;
        error: string | null;
      };

      if (!response.ok || json.error) {
        throw new Error(json.error ?? `서버 오류 (${response.status})`);
      }

      const images = json.data?.images ?? [];

      // 새 결과를 목록 맨 앞에 추가
      const newResult: InstagramResult = {
        id: nanoid(),
        contentType: selectedType,
        images,
        caption: null,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };

      setResults((prev) => [newResult, ...prev]);
      toast.success('이미지가 생성되었습니다.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setIsGeneratingImage(false);
    }
  }, [
    selectedType,
    selectedTypeConfig,
    buildBrandDNA,
    keywords,
    layers,
    title,
    subtitle,
    productName,
    slideCount,
    bodyText,
    steps,
    beforeText,
    afterText,
    eventTitle,
    eventDate,
    eventDiscount,
  ]);

  // 캡션 생성
  const handleGenerateCaption = useCallback(async () => {
    if (!selectedType || !selectedTypeConfig) return;

    setIsGeneratingCaption(true);

    const brandDNA = buildBrandDNA();
    const parsedKeywords = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const copyStyle =
      layers.verbalIdentity?.copyStyle ??
      layers.creativeStyle?.copyStyle ??
      undefined;

    const designTone =
      layers.visualIdentity?.designTone ??
      layers.creativeStyle?.designTone ??
      undefined;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandDNA,
          input: {
            projectId,
            channel: 'instagram',
            contentType: selectedType,
            keywords: parsedKeywords,
            productName: productName.trim() || undefined,
            copyStyle,
            designTone,
            additionalPrompt: additionalPrompt.trim() || undefined,
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
        throw new Error('캡션 데이터가 없습니다.');
      }

      // body에서 캡션 필드 추출 (generate API 응답 구조에 맞게)
      const body = json.data.body as {
        caption?: string;
        hashtags?: string[];
        hookLine?: string;
        cta?: string;
      };

      const generatedCaption: GeneratedCaption = {
        caption: body.caption ?? '',
        hashtags: body.hashtags ?? [],
        hookLine: body.hookLine ?? '',
        cta: body.cta ?? '',
      };

      // 가장 최근 결과에 캡션 연결, 없으면 새 결과 생성
      setResults((prev) => {
        if (prev.length === 0) {
          const newResult: InstagramResult = {
            id: nanoid(),
            contentType: selectedType,
            images: [],
            caption: generatedCaption,
            status: 'draft',
            createdAt: new Date().toISOString(),
          };
          return [newResult];
        }
        return prev.map((r, i) =>
          i === 0 ? { ...r, caption: generatedCaption } : r
        );
      });

      toast.success('캡션이 생성되었습니다.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setIsGeneratingCaption(false);
    }
  }, [
    selectedType,
    selectedTypeConfig,
    buildBrandDNA,
    keywords,
    layers,
    projectId,
    productName,
    additionalPrompt,
  ]);

  const isCarouselType =
    selectedType === 'info_card_carousel' ||
    selectedType === 'routine_guide' ||
    selectedType === 'before_after';

  const isGenerateDisabled = !selectedType || completeness < 25;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">인스타그램 콘텐츠</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Brand DNA 기반 6종 인스타그램 타입 중 선택하여 이미지와 캡션을 생성합니다.
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

      {/* 3. 인스타그램 타입 선택 */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold">콘텐츠 타입 선택</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            생성할 인스타그램 콘텐츠의 유형을 선택하세요.
          </p>
        </div>
        <InstagramTypeSelector selectedType={selectedType} onSelect={handleTypeSelect} />
      </div>

      {/* 4. 선택된 타입 상세 정보 */}
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
              {/* 이미지 사이즈 */}
              <div>
                <span className="font-medium text-foreground">이미지: </span>
                {selectedTypeConfig.imageSize.width} × {selectedTypeConfig.imageSize.height}px
              </div>
              {/* 슬라이드 수 */}
              <div>
                <span className="font-medium text-foreground">슬라이드: </span>
                {selectedTypeConfig.slideCount.min === selectedTypeConfig.slideCount.max
                  ? `${selectedTypeConfig.slideCount.min}장`
                  : `${selectedTypeConfig.slideCount.min}~${selectedTypeConfig.slideCount.max}장`}
              </div>
            </div>
            {/* 캡션 규칙 */}
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">캡션 규칙: </span>
              {selectedTypeConfig.captionRule}
            </p>
            {/* 해시태그 규칙 */}
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">해시태그 규칙: </span>
              {selectedTypeConfig.hashtagRule}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 5. 생성 폼 (타입 선택 후 표시) */}
      {selectedType && (
        <Card>
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-sm font-semibold">생성 옵션</CardTitle>
            <CardDescription className="text-xs">
              내용을 입력하면 더 정확한 이미지와 캡션이 생성됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-5">
            {/* 제목/메인 카피 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title" className="text-xs font-medium">
                제목 / 메인 카피{' '}
                <span className="text-muted-foreground">(필수)</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="메인 카피 또는 헤드라인을 입력하세요"
                className="text-sm"
              />
            </div>

            {/* 서브 카피 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subtitle" className="text-xs font-medium">
                서브 카피{' '}
                <span className="text-muted-foreground">(선택)</span>
              </Label>
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="서브 카피를 입력하세요"
                className="text-sm"
              />
            </div>

            {/* 제품명 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-name" className="text-xs font-medium">
                제품명{' '}
                <span className="text-muted-foreground">(선택)</span>
              </Label>
              <Input
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="특정 제품명을 입력하세요"
                className="text-sm"
              />
            </div>

            {/* info_card_carousel / brand_mood 전용: 본문 텍스트 */}
            {(selectedType === 'info_card_carousel' || selectedType === 'brand_mood') && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="body-text" className="text-xs font-medium">
                  본문{' '}
                  <span className="text-muted-foreground">(선택)</span>
                </Label>
                <Textarea
                  id="body-text"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="카드에 들어갈 핵심 내용을 입력하세요"
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            )}

            {/* routine_guide 전용: 단계 입력 */}
            {selectedType === 'routine_guide' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="steps" className="text-xs font-medium">
                  루틴 단계{' '}
                  <span className="text-muted-foreground">(쉼표로 구분)</span>
                </Label>
                <Input
                  id="steps"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="예: 클렌징, 토너, 에센스, 크림, 선크림"
                  className="text-sm"
                />
                {steps.trim() && (
                  <div className="flex flex-wrap gap-1">
                    {steps
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((step, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {i + 1}. {step}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* before_after 전용: 비포/애프터 텍스트 */}
            {selectedType === 'before_after' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="before-text" className="text-xs font-medium">
                    Before 텍스트
                  </Label>
                  <Input
                    id="before-text"
                    value={beforeText}
                    onChange={(e) => setBeforeText(e.target.value)}
                    placeholder="변화 전 상태를 설명하세요"
                    className="text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="after-text" className="text-xs font-medium">
                    After 텍스트
                  </Label>
                  <Input
                    id="after-text"
                    value={afterText}
                    onChange={(e) => setAfterText(e.target.value)}
                    placeholder="변화 후 상태를 설명하세요"
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            {/* event_promo 전용: 이벤트 정보 */}
            {selectedType === 'event_promo' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-title" className="text-xs font-medium">
                    이벤트 제목
                  </Label>
                  <Input
                    id="event-title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="이벤트 이름을 입력하세요"
                    className="text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-3">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor="event-date" className="text-xs font-medium">
                      이벤트 기간{' '}
                      <span className="text-muted-foreground">(선택)</span>
                    </Label>
                    <Input
                      id="event-date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      placeholder="예: 2025.03.01~03.31"
                      className="text-sm"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor="event-discount" className="text-xs font-medium">
                      할인/혜택{' '}
                      <span className="text-muted-foreground">(선택)</span>
                    </Label>
                    <Input
                      id="event-discount"
                      value={eventDiscount}
                      onChange={(e) => setEventDiscount(e.target.value)}
                      placeholder="예: 30% 할인, 1+1 증정"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 키워드 입력 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="keywords" className="text-xs font-medium">
                키워드{' '}
                <span className="text-muted-foreground">(쉼표로 구분, 선택)</span>
              </Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="예: 세럼, 피부관리, 보습, 비타민C"
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

            {/* 슬라이드 수 (캐러셀 타입) */}
            {selectedTypeConfig &&
              (isCarouselType ||
                selectedTypeConfig.slideCount.min !== selectedTypeConfig.slideCount.max) && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="slide-count" className="text-xs font-medium">
                    슬라이드 수
                  </Label>
                  <Input
                    id="slide-count"
                    type="number"
                    min={selectedTypeConfig.slideCount.min}
                    max={selectedTypeConfig.slideCount.max}
                    value={slideCount}
                    onChange={(e) => handleSlideCountChange(e.target.value)}
                    className="w-24 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedTypeConfig.slideCount.min}~{selectedTypeConfig.slideCount.max}장
                    범위 내에서 입력하세요.
                  </p>
                </div>
              )}

            {/* 추가 요청사항 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="additional-prompt" className="text-xs font-medium">
                추가 요청사항{' '}
                <span className="text-muted-foreground">(선택)</span>
              </Label>
              <Textarea
                id="additional-prompt"
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                placeholder="AI에게 추가로 전달할 내용 (톤, 강조 포인트 등)"
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <Separator />

            {/* 생성 버튼 */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => void handleGenerateImage()}
                disabled={isGenerateDisabled || isGeneratingImage || isGeneratingCaption}
                className="gap-2"
              >
                <ImageIcon className="size-4" />
                {isGeneratingImage ? '이미지 생성 중...' : '이미지 생성'}
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleGenerateCaption()}
                disabled={isGenerateDisabled || isGeneratingImage || isGeneratingCaption}
                className="gap-2"
              >
                <Type className="size-4" />
                {isGeneratingCaption ? '캡션 생성 중...' : '캡션 생성'}
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

      {/* 6. 결과 섹션 */}
      <div className="flex flex-col gap-3">
        {results.length > 0 && (
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">생성된 콘텐츠</h2>
            <Badge variant="secondary" className="text-xs">
              {results.length}개
            </Badge>
          </div>
        )}

        {(isGeneratingImage || isGeneratingCaption) && results.length === 0 ? (
          // 첫 생성 중: 스켈레톤
          <Card>
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5] w-full rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ) : results.length === 0 ? (
          // 빈 상태
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                아직 생성된 콘텐츠가 없습니다
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                콘텐츠 타입을 선택하고 이미지 또는 캡션 생성 버튼을 눌러보세요.
              </p>
            </CardContent>
          </Card>
        ) : (
          // 결과 카드 목록
          <div className="flex flex-col gap-6">
            {results.map((result, index) => (
              <Card key={result.id}>
                {/* 결과 헤더 */}
                <CardHeader className="pb-3 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      #{results.length - index}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {INSTAGRAM_TYPES.find((t) => t.id === result.contentType)?.nameKo ??
                        result.contentType}
                    </Badge>
                    {result.status === 'approved' && (
                      <Badge className="text-xs">승인됨</Badge>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(result.createdAt).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-5 pb-5">
                  {/* 이미지 그리드 */}
                  {(isGeneratingImage && index === 0 && result.images.length === 0) ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {Array.from({ length: slideCount }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[4/5] w-full rounded-lg" />
                      ))}
                    </div>
                  ) : result.images.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        이미지 ({result.images.length}장)
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {result.images.map((img) => (
                          <div
                            key={img.slideNumber}
                            className="relative overflow-hidden rounded-lg border bg-muted"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`data:image/png;base64,${img.imageBase64}`}
                              alt={`슬라이드 ${img.slideNumber}`}
                              className="aspect-[4/5] w-full object-cover"
                            />
                            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                              {img.slideNumber}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* 캡션 미리보기 */}
                  {(isGeneratingCaption && index === 0 && !result.caption) ? (
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-16 w-full" />
                      <div className="flex gap-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-5 w-16 rounded-full" />
                        ))}
                      </div>
                    </div>
                  ) : result.caption ? (
                    <div className="flex flex-col gap-3">
                      <p className="text-xs font-medium text-muted-foreground">캡션</p>

                      {/* 훅 라인 (강조) */}
                      {result.caption.hookLine && (
                        <p className="text-sm font-semibold text-foreground">
                          {result.caption.hookLine}
                        </p>
                      )}

                      {/* 본문 캡션 */}
                      {result.caption.caption && (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                          {result.caption.caption}
                        </p>
                      )}

                      {/* CTA */}
                      {result.caption.cta && (
                        <p className="text-sm font-medium text-primary">
                          {result.caption.cta}
                        </p>
                      )}

                      {/* 해시태그 */}
                      {result.caption.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {result.caption.hashtags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* 이미지도 캡션도 없으면 안내 */}
                  {result.images.length === 0 && !result.caption && (
                    <p className="text-xs text-muted-foreground">
                      이미지 생성 또는 캡션 생성 버튼을 눌러 콘텐츠를 만들어보세요.
                    </p>
                  )}

                  <Separator />

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                    {result.status !== 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(result.id)}
                        className="text-xs"
                      >
                        승인
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleGenerateImage()}
                      disabled={isGeneratingImage || isGeneratingCaption || isGenerateDisabled}
                      className="text-xs"
                    >
                      이미지 재생성
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleGenerateCaption()}
                      disabled={isGeneratingImage || isGeneratingCaption || isGenerateDisabled}
                      className="text-xs"
                    >
                      캡션 재생성
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
