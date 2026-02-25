'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TagInput } from '@/components/brand-dna/tag-input';
import { CopyStyleSelector } from '@/components/brand-dna/copy-style-card';
import { DesignToneSelector } from '@/components/brand-dna/design-tone-card';
import { useBrandDNAStore } from '@/stores/brand-dna-store';
import type { ChannelConfig, Competitor } from '@/types/brand-dna';

// 채널 메타데이터
interface ChannelMeta {
  id: ChannelConfig['channel'];
  label: string;
  description: string;
}

const CHANNELS: ChannelMeta[] = [
  {
    id: 'site',
    label: '판매사이트',
    description: '브랜드 판매 페이지를 자동 생성합니다',
  },
  {
    id: 'blog',
    label: '블로그',
    description: '네이버·티스토리용 블로그 포스트를 생성합니다',
  },
  {
    id: 'instagram',
    label: '인스타그램',
    description: '1080×1350 카드뉴스 이미지를 생성합니다',
  },
  {
    id: 'shortform',
    label: '숏폼/틱톡',
    description: '스크립트 및 자막 텍스트를 생성합니다',
  },
];

// 빈 경쟁사 객체 팩토리
function emptyCompetitor(): Competitor {
  return { name: '', websiteUrl: '' };
}

// ChannelConfig 배열 초기값 생성 (모두 비활성)
function defaultChannels(): ChannelConfig[] {
  return CHANNELS.map((ch, idx) => ({
    channel: ch.id,
    enabled: false,
    priority: idx + 1,
  }));
}

export function WizardStep3() {
  const { layers, updateLayer } = useBrandDNAStore();

  // ── 카피 스타일 ──────────────────────────────────────────
  const [copyStyle, setCopyStyle] = useState<string>(
    layers.creativeStyle?.copyStyle ?? layers.verbalIdentity?.copyStyle ?? ''
  );

  // ── 디자인 톤 ────────────────────────────────────────────
  const [designTone, setDesignTone] = useState<string>(
    layers.creativeStyle?.designTone ?? layers.visualIdentity?.designTone ?? ''
  );

  // ── 채널 ─────────────────────────────────────────────────
  const [channels, setChannels] = useState<ChannelConfig[]>(() => {
    if (layers.channelStrategy?.channels?.length) {
      return layers.channelStrategy.channels;
    }
    return defaultChannels();
  });

  // ── 경쟁사 ───────────────────────────────────────────────
  const [competitors, setCompetitors] = useState<Competitor[]>(() => {
    const stored = layers.competitivePosition?.directCompetitors;
    if (stored?.length) return stored;
    return [emptyCompetitor()];
  });

  // ── 참고 URL ─────────────────────────────────────────────
  const [referenceUrls, setReferenceUrls] = useState<string[]>(
    layers.creativeStyle?.referenceUrls ?? []
  );

  // store 외부 변경 시 초기화 (첫 마운트 한 번만)
  useEffect(() => {
    const cs = layers.creativeStyle;
    const vi = layers.visualIdentity;
    const ve = layers.verbalIdentity;
    setCopyStyle(cs?.copyStyle ?? ve?.copyStyle ?? '');
    setDesignTone(cs?.designTone ?? vi?.designTone ?? '');
    setReferenceUrls(cs?.referenceUrls ?? []);

    if (layers.channelStrategy?.channels?.length) {
      setChannels(layers.channelStrategy.channels);
    }
    if (layers.competitivePosition?.directCompetitors?.length) {
      setCompetitors(layers.competitivePosition.directCompetitors);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 카피 스타일 변경 핸들러 ──────────────────────────────
  function handleCopyStyleChange(id: string) {
    setCopyStyle(id);
    updateLayer('verbalIdentity', {
      toneOfVoice: layers.verbalIdentity?.toneOfVoice ?? [],
      keyMessages: layers.verbalIdentity?.keyMessages ?? [],
      copyStyle: id,
    });
    updateLayer('creativeStyle', {
      copyStyle: id,
      designTone,
      referenceUrls,
    });
  }

  // ── 디자인 톤 변경 핸들러 ────────────────────────────────
  function handleDesignToneChange(id: string) {
    setDesignTone(id);
    updateLayer('visualIdentity', {
      primaryColors: layers.visualIdentity?.primaryColors ?? [],
      designTone: id,
    });
    updateLayer('creativeStyle', {
      copyStyle,
      designTone: id,
      referenceUrls,
    });
  }

  // ── 채널 토글 핸들러 ─────────────────────────────────────
  function toggleChannel(channelId: ChannelConfig['channel']) {
    const next = channels.map((ch) =>
      ch.channel === channelId ? { ...ch, enabled: !ch.enabled } : ch
    );
    setChannels(next);

    const enabledChannels = next.filter((ch) => ch.enabled);
    const primaryChannel = enabledChannels[0]?.channel ?? '';
    updateLayer('channelStrategy', {
      primaryChannel,
      channels: next,
    });
  }

  // ── 경쟁사 핸들러 ────────────────────────────────────────
  function addCompetitor() {
    if (competitors.length >= 3) return;
    const next = [...competitors, emptyCompetitor()];
    setCompetitors(next);
    syncCompetitors(next);
  }

  function removeCompetitor(index: number) {
    const next = competitors.filter((_, i) => i !== index);
    setCompetitors(next);
    syncCompetitors(next);
  }

  function updateCompetitor(index: number, field: keyof Pick<Competitor, 'name' | 'websiteUrl'>, value: string) {
    const next = competitors.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    );
    setCompetitors(next);
    syncCompetitors(next);
  }

  function syncCompetitors(list: Competitor[]) {
    updateLayer('competitivePosition', {
      directCompetitors: list,
      differentiators: layers.competitivePosition?.differentiators ?? [],
    });
  }

  // ── 참고 URL 핸들러 ──────────────────────────────────────
  function handleReferenceUrlsChange(urls: string[]) {
    setReferenceUrls(urls);
    updateLayer('creativeStyle', {
      copyStyle,
      designTone,
      referenceUrls: urls,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Card 1: 카피 스타일 ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>카피 스타일</CardTitle>
          <CardDescription>
            브랜드 콘텐츠에 적용할 카피라이팅 스타일을 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CopyStyleSelector value={copyStyle} onChange={handleCopyStyleChange} />
        </CardContent>
      </Card>

      {/* ── Card 2: 디자인 톤 ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>디자인 톤</CardTitle>
          <CardDescription>
            브랜드의 시각적 분위기를 결정하는 디자인 톤을 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DesignToneSelector value={designTone} onChange={handleDesignToneChange} />
        </CardContent>
      </Card>

      {/* ── Card 3: 채널 & 경쟁사 ──────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>채널 & 경쟁사</CardTitle>
          <CardDescription>
            운영할 채널을 선택하고 주요 경쟁사를 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* 채널 선택 */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">활성화할 채널</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CHANNELS.map((ch) => {
                const config = channels.find((c) => c.channel === ch.id);
                const isEnabled = config?.enabled ?? false;

                return (
                  <label
                    key={ch.id}
                    className={[
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                      isEnabled
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleChannel(ch.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium leading-none">{ch.label}</span>
                      <span className="text-xs text-muted-foreground">{ch.description}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* 경쟁사 입력 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                경쟁사 <span className="text-muted-foreground font-normal">(최대 3개)</span>
              </Label>
              {competitors.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCompetitor}
                >
                  + 경쟁사 추가
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {competitors.map((competitor, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded-lg border border-border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      경쟁사 {index + 1}
                    </span>
                    {competitors.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCompetitor(index)}
                        className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`competitor-name-${index}`} className="text-xs">
                        경쟁사명
                      </Label>
                      <Input
                        id={`competitor-name-${index}`}
                        placeholder="예) 경쟁브랜드"
                        value={competitor.name}
                        onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`competitor-url-${index}`} className="text-xs">
                        웹사이트 URL
                      </Label>
                      <Input
                        id={`competitor-url-${index}`}
                        placeholder="https://example.com"
                        value={competitor.websiteUrl ?? ''}
                        onChange={(e) => updateCompetitor(index, 'websiteUrl', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 참고 URL */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">
              참고 URL{' '}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              마음에 드는 브랜드 사이트나 콘텐츠 URL을 입력하면 스타일 참고에 활용합니다.
            </p>
            <TagInput
              value={referenceUrls}
              onChange={handleReferenceUrlsChange}
              placeholder="https://example.com 입력 후 Enter"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
