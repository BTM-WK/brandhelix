'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertCircle,
  Video,
  Sparkles,
  Copy,
  RotateCcw,
  Check,
  Loader2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { ShortformTypeSelector } from '@/components/content/shortform-type-selector';
import { ShortformPreview } from '@/components/content/shortform-preview';
import type { ShortformPreviewContent } from '@/components/content/shortform-preview';
import type { ShortformType } from '@/types/shortform';
import { SHORTFORM_TYPES, getShortformTypeConfig } from '@/types/shortform';
import { COPY_STYLES, DESIGN_TONES } from '@/types/style';
import { useBrandDNAStore } from '@/stores/brand-dna-store';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ShortformPageProps {
  params: Promise<{ id: string }>;
}

interface GeneratedScript {
  id: string;
  type: ShortformType;
  content: ShortformPreviewContent;
  thumbnailUrl: string | null;
  createdAt: string;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ShortformPage({ params }: ShortformPageProps) {
  const { id: projectId } = use(params);

  const { layers, calculateCompleteness } = useBrandDNAStore();
  const completeness = calculateCompleteness();

  // 폼 상태
  const [selectedType, setSelectedType] = useState<ShortformType | null>(null);
  const [productName, setProductName] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [copyStyle, setCopyStyle] = useState('burnett');
  const [designTone, setDesignTone] = useState('modern_minimal');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [trendReference, setTrendReference] = useState('');

  // 생성 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<ShortformPreviewContent | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [generatedScripts, setGeneratedScripts] = useState<GeneratedScript[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 선택된 타입 설정 조회
  const selectedTypeConfig = selectedType
    ? getShortformTypeConfig(selectedType) ?? null
    : null;

  // 스크립트 내레이션을 클립보드에 복사
  const handleCopyScript = useCallback(
    async (content: ShortformPreviewContent, scriptId?: string) => {
      const lines = content.scenes.map(
        (s) => `[씬 ${s.sceneNumber} | ${s.duration}]\n${s.narration}`
      );
      const fullText = [
        `제목: ${content.title}`,
        `훅: ${content.hookLine}`,
        '',
        ...lines,
        '',
        content.cta ? `CTA: ${content.cta}` : '',
        content.hashtags?.length
          ? `해시태그: ${content.hashtags.join(' ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      try {
        await navigator.clipboard.writeText(fullText);
        toast.success('스크립트가 클립보드에 복사되었습니다.');
        if (scriptId) {
          setCopiedId(scriptId);
          setTimeout(() => setCopiedId(null), 2000);
        }
      } catch {
        toast.error('클립보드 복사에 실패했습니다.');
      }
    },
    []
  );

  // 승인 핸들러
  const handleApprove = useCallback((scriptId: string) => {
    toast.success('스크립트가 승인되었습니다.');
    // 향후 서버에 상태 업데이트 연동 예정
    void scriptId;
  }, []);

  // 스크립트 생성
  const handleGenerate = useCallback(async () => {
    if (!selectedType) return;

    setIsGenerating(true);
    toast.info('숏폼 스크립트를 생성하고 있습니다...');

    try {
      // 1. 스크립트 생성 API 호출
      const keywords = keywordsInput
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const scriptRes = await fetch('/api/generate/shortform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortformType: selectedType,
          productName: productName.trim() || undefined,
          keywords: keywords.length > 0 ? keywords : undefined,
          copyStyle,
          designTone,
          additionalPrompt: additionalPrompt.trim() || undefined,
          trendReference: trendReference.trim() || undefined,
          brandDNA: {
            brandName: layers?.brandCore?.brandName,
            companyName: layers?.companyIdentity?.companyName,
            industry: layers?.companyIdentity?.industry,
            mainProducts: layers?.companyIdentity?.mainProducts,
            brandSlogan: layers?.brandCore?.brandSlogan,
            usp: layers?.brandCore?.usp,
            coreValues: layers?.brandCore?.coreValues,
            toneOfVoice: layers?.verbalIdentity?.toneOfVoice,
            keyMessages: layers?.verbalIdentity?.keyMessages,
            forbiddenWords: layers?.verbalIdentity?.forbiddenWords,
            primaryAge: layers?.targetAudience?.primaryAge,
            gender: layers?.targetAudience?.gender,
            interests: layers?.targetAudience?.interests,
            painPoints: layers?.targetAudience?.painPoints,
            designTone: layers?.visualIdentity?.designTone ?? designTone,
            copyStyle: layers?.creativeStyle?.copyStyle ?? copyStyle,
          },
        }),
      });

      const scriptData = (await scriptRes.json()) as {
        data: ShortformPreviewContent | null;
        error: string | null;
      };

      if (!scriptRes.ok || scriptData.error) {
        throw new Error(scriptData.error ?? `서버 오류 (${scriptRes.status})`);
      }

      if (!scriptData.data) {
        throw new Error('스크립트 데이터가 없습니다.');
      }

      const scriptContent: ShortformPreviewContent = scriptData.data;
      setGeneratedScript(scriptContent);

      // 2. 썸네일 생성 (실패해도 진행)
      let thumbUrl: string | null = null;
      try {
        const thumbRes = await fetch('/api/images/shortform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hookLine: scriptContent.hookLine,
            shortformType: selectedType,
            designTone,
            brandName: layers?.brandCore?.brandName ?? 'Brand',
            productName: productName.trim() || undefined,
            title: scriptContent.title,
          }),
        });
        const thumbData = (await thumbRes.json()) as {
          data: { image: string } | null;
          error: string | null;
        };
        if (!thumbData.error && thumbData.data?.image) {
          thumbUrl = thumbData.data.image;
          setThumbnailUrl(thumbUrl);
        }
      } catch {
        // Thumbnail generation failure is non-critical
        console.warn('Thumbnail generation failed');
      }

      // 3. 결과 목록에 추가
      setGeneratedScripts((prev) => [
        {
          id: crypto.randomUUID(),
          type: selectedType,
          content: scriptContent,
          thumbnailUrl: thumbUrl,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      toast.success('숏폼 스크립트가 생성되었습니다!');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '생성 중 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedType,
    keywordsInput,
    productName,
    copyStyle,
    designTone,
    additionalPrompt,
    trendReference,
    layers,
  ]);

  const isGenerateDisabled = !selectedType || completeness < 25 || isGenerating;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. 페이지 헤더 */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Video className="h-6 w-6" />
          숏폼 콘텐츠
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          틱톡, 유튜브 숏츠, 인스타 릴스용 스크립트와 썸네일을 자동 생성합니다.
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
                Brand DNA 입력하러 가기 &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. 콘텐츠 유형 선택 */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold">콘텐츠 유형 선택</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            생성할 숏폼 콘텐츠의 유형을 선택하세요.
          </p>
        </div>
        <ShortformTypeSelector selectedType={selectedType} onSelect={setSelectedType} />
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
              {selectedTypeConfig.purpose}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {/* 재생 시간 */}
              <div>
                <span className="font-medium text-foreground">재생 시간: </span>
                {selectedTypeConfig.durationRange.min === selectedTypeConfig.durationRange.max
                  ? `${selectedTypeConfig.durationRange.min}초`
                  : `${selectedTypeConfig.durationRange.min}~${selectedTypeConfig.durationRange.max}초`}
              </div>
              {/* 씬 수 */}
              <div>
                <span className="font-medium text-foreground">씬 수: </span>
                {selectedTypeConfig.sceneCount.min === selectedTypeConfig.sceneCount.max
                  ? `${selectedTypeConfig.sceneCount.min}씬`
                  : `${selectedTypeConfig.sceneCount.min}~${selectedTypeConfig.sceneCount.max}씬`}
              </div>
            </div>
            {/* 구조 */}
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">구조: </span>
              {selectedTypeConfig.structure.join(' → ')}
            </p>
            {/* 해시태그 규칙 */}
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">해시태그 규칙: </span>
              {selectedTypeConfig.hashtagRule}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 5. 생성 옵션 폼 (타입 선택 후 표시) */}
      {selectedType && (
        <Card>
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-sm font-semibold">생성 옵션</CardTitle>
            <CardDescription className="text-xs">
              {selectedTypeConfig?.nameKo} 스크립트를 위한 세부 옵션을 설정하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-5">
            {/* 제품명 */}
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

            {/* 키워드 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="keywords" className="text-xs font-medium">
                키워드 <span className="text-muted-foreground">(쉼표로 구분, 선택)</span>
              </Label>
              <Input
                id="keywords"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="키워드를 쉼표로 구분하여 입력 (예: 세럼, 피부관리, 보습)"
                className="text-sm"
              />
              {keywordsInput.trim() && (
                <div className="flex flex-wrap gap-1">
                  {keywordsInput
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

            {/* 카피 스타일 셀렉터 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="copy-style" className="text-xs font-medium">
                카피 스타일
              </Label>
              <Select value={copyStyle} onValueChange={setCopyStyle}>
                <SelectTrigger id="copy-style" className="text-sm">
                  <SelectValue placeholder="카피 스타일 선택" />
                </SelectTrigger>
                <SelectContent>
                  {COPY_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.nameKo} — {style.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 디자인 톤 셀렉터 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="design-tone" className="text-xs font-medium">
                디자인 톤
              </Label>
              <Select value={designTone} onValueChange={setDesignTone}>
                <SelectTrigger id="design-tone" className="text-sm">
                  <SelectValue placeholder="디자인 톤 선택" />
                </SelectTrigger>
                <SelectContent>
                  {DESIGN_TONES.map((tone) => (
                    <SelectItem key={tone.id} value={tone.id}>
                      {tone.name} — {tone.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 트렌드 참고 (trend_challenge 전용) */}
            {selectedType === 'trend_challenge' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="trend-reference" className="text-xs font-medium">
                  트렌드 참고 <span className="text-muted-foreground">(선택)</span>
                </Label>
                <Input
                  id="trend-reference"
                  value={trendReference}
                  onChange={(e) => setTrendReference(e.target.value)}
                  placeholder="참고할 트렌드나 챌린지 (예: '그릭 요거트 챌린지')"
                  className="text-sm"
                />
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
                className="min-w-32 gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    스크립트 생성
                  </>
                )}
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

      {/* 6. 최신 결과 미리보기 */}
      {generatedScript && (
        <div>
          <h2 className="mb-3 text-base font-semibold">생성 결과</h2>
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* 왼쪽: 썸네일 */}
            <div>
              {thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailUrl}
                  alt="숏폼 썸네일"
                  className="w-full rounded-lg border"
                />
              ) : (
                <div className="flex aspect-[9/16] max-h-[533px] items-center justify-center rounded-lg border bg-muted">
                  <span className="text-sm text-muted-foreground">썸네일 없음</span>
                </div>
              )}

              {/* 썸네일 하단 액션 버튼 */}
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => void handleGenerate()}
                  disabled={isGenerating}
                >
                  <RotateCcw className="size-3.5" />
                  재생성
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => handleApprove(generatedScripts[0]?.id ?? '')}
                >
                  <Check className="size-3.5" />
                  승인
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => void handleCopyScript(generatedScript)}
                >
                  <Copy className="size-3.5" />
                  복사
                </Button>
              </div>
            </div>

            {/* 오른쪽: 스크립트 미리보기 */}
            <ShortformPreview
              content={generatedScript}
              thumbnailUrl={thumbnailUrl ?? undefined}
            />
          </div>
        </div>
      )}

      {/* 7. 생성된 스크립트 목록 */}
      {generatedScripts.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              생성된 스크립트
            </h2>
            <Badge variant="secondary" className="text-xs">
              {generatedScripts.length}건
            </Badge>
          </div>

          <div className="flex flex-col gap-4">
            {generatedScripts.map((script) => {
              const typeConfig = getShortformTypeConfig(script.type);

              return (
                <Card key={script.id} className="transition-shadow hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* 썸네일 미니 */}
                      {script.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={script.thumbnailUrl}
                          alt=""
                          className="h-24 w-[54px] shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-[54px] shrink-0 items-center justify-center rounded bg-muted">
                          <Video className="size-4 text-muted-foreground" />
                        </div>
                      )}

                      {/* 스크립트 정보 */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium leading-snug line-clamp-1">
                          {script.content.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {script.content.hookLine}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {typeConfig && (
                            <Badge variant="outline" className="text-[10px]">
                              {typeConfig.nameKo}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">
                            {script.content.totalDuration}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {script.content.platform}
                          </Badge>
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {new Date(script.createdAt).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* 복사 버튼 */}
                      <div className="flex shrink-0 items-start">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => void handleCopyScript(script.content, script.id)}
                          aria-label="스크립트 복사"
                        >
                          {copiedId === script.id ? (
                            <Check className="size-3.5 text-green-600" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 빈 상태 (타입 선택 전, 생성 이력 없음) */}
      {!selectedType && generatedScripts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Video className="mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              아직 생성된 스크립트가 없습니다
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              숏폼 유형을 선택하고 스크립트 생성 버튼을 눌러보세요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
