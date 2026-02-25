'use client';

import {
  Building2,
  Heart,
  Users,
  Palette,
  MessageSquare,
  Target,
  Share2,
  Sparkles,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BrandDNALayers, Competitor } from '@/types/brand-dna';

interface DNAReportProps {
  layers: Partial<BrandDNALayers>;
}

// 레이어별 메타데이터 정의
const LAYER_META = [
  {
    key: 'companyIdentity' as const,
    label: '기업 정보',
    Icon: Building2,
  },
  {
    key: 'brandCore' as const,
    label: '브랜드 핵심',
    Icon: Heart,
  },
  {
    key: 'targetAudience' as const,
    label: '타겟 고객',
    Icon: Users,
  },
  {
    key: 'visualIdentity' as const,
    label: '비주얼 아이덴티티',
    Icon: Palette,
  },
  {
    key: 'verbalIdentity' as const,
    label: '버벌 아이덴티티',
    Icon: MessageSquare,
  },
  {
    key: 'competitivePosition' as const,
    label: '경쟁 포지션',
    Icon: Target,
  },
  {
    key: 'channelStrategy' as const,
    label: '채널 전략',
    Icon: Share2,
  },
  {
    key: 'creativeStyle' as const,
    label: '크리에이티브 스타일',
    Icon: Sparkles,
  },
] as const;

// 한국어 필드명 매핑
const FIELD_LABELS: Record<string, string> = {
  companyName: '회사명',
  industry: '업종',
  foundedYear: '설립연도',
  employeeCount: '직원 수',
  annualRevenue: '연매출',
  mainProducts: '주요 상품/서비스',
  businessModel: '비즈니스 모델',
  missionStatement: '미션/비전',
  brandName: '브랜드명',
  brandSlogan: '브랜드 슬로건',
  brandStory: '브랜드 스토리',
  coreValues: '핵심 가치',
  brandPersonality: '브랜드 퍼소나',
  brandPromise: '브랜드 약속',
  usp: 'USP',
  primaryAge: '주요 연령대',
  gender: '성별',
  location: '지역',
  income: '소득 수준',
  interests: '관심사',
  painPoints: '페인 포인트',
  buyingMotivation: '구매 동기',
  mediaConsumption: '미디어 소비 채널',
  primaryColors: '주 색상',
  secondaryColors: '보조 색상',
  logoUrl: '로고 URL',
  fontFamily: '폰트',
  imageStyle: '이미지 스타일',
  designTone: '디자인 톤',
  toneOfVoice: '말투',
  writingStyle: '글쓰기 스타일',
  keyMessages: '핵심 메시지',
  forbiddenWords: '금지어',
  copyStyle: '카피 스타일',
  hashtags: '해시태그',
  directCompetitors: '직접 경쟁사',
  indirectCompetitors: '간접 경쟁사',
  differentiators: '차별화 포인트',
  marketPosition: '시장 포지션',
  primaryChannel: '주요 채널',
  channels: '채널 목록',
  postingFrequency: '게시 빈도',
  referenceUrls: '레퍼런스 URL',
  moodKeywords: '무드 키워드',
};

// 경쟁사 미니 리스트 렌더
function CompetitorList({ competitors }: { competitors: Competitor[] }) {
  if (competitors.length === 0) return null;

  return (
    <ul className="space-y-1">
      {competitors.map((competitor, index) => (
        <li key={index} className="flex items-center gap-2 text-sm">
          <span className="font-medium">{competitor.name}</span>
          {competitor.websiteUrl && (
            <a
              href={competitor.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              {competitor.websiteUrl}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

// 레이어 데이터를 key-value 쌍으로 렌더
function LayerContent({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, value]) => {
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">아직 분석되지 않았습니다</p>
    );
  }

  return (
    <dl className="space-y-3">
      {entries.map(([key, value]) => {
        const label = FIELD_LABELS[key] ?? key;

        // 경쟁사 배열 처리
        if (
          (key === 'directCompetitors' || key === 'indirectCompetitors') &&
          Array.isArray(value)
        ) {
          return (
            <div key={key}>
              <dt className="mb-1 text-xs font-medium text-muted-foreground">
                {label}
              </dt>
              <dd>
                <CompetitorList competitors={value as Competitor[]} />
              </dd>
            </div>
          );
        }

        // 채널 목록 처리
        if (key === 'channels' && Array.isArray(value)) {
          return (
            <div key={key}>
              <dt className="mb-1 text-xs font-medium text-muted-foreground">
                {label}
              </dt>
              <dd className="flex flex-wrap gap-1.5">
                {(value as { channel: string; enabled: boolean; priority: number }[])
                  .filter((ch) => ch.enabled)
                  .sort((a, b) => a.priority - b.priority)
                  .map((ch) => (
                    <Badge key={ch.channel} variant="secondary">
                      {ch.channel}
                    </Badge>
                  ))}
              </dd>
            </div>
          );
        }

        // 게시 빈도 객체 처리
        if (key === 'postingFrequency' && typeof value === 'object' && value !== null) {
          const freqEntries = Object.entries(value as Record<string, string>);
          return (
            <div key={key}>
              <dt className="mb-1 text-xs font-medium text-muted-foreground">
                {label}
              </dt>
              <dd className="flex flex-wrap gap-1.5">
                {freqEntries.map(([channel, freq]) => (
                  <Badge key={channel} variant="outline">
                    {channel}: {freq}
                  </Badge>
                ))}
              </dd>
            </div>
          );
        }

        // 일반 배열 → Badge 렌더
        if (Array.isArray(value)) {
          return (
            <div key={key}>
              <dt className="mb-1 text-xs font-medium text-muted-foreground">
                {label}
              </dt>
              <dd className="flex flex-wrap gap-1.5">
                {(value as string[]).map((item, index) => (
                  <Badge key={index} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </dd>
            </div>
          );
        }

        // 숫자 / 문자열 렌더
        return (
          <div key={key}>
            <dt className="text-xs font-medium text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-0.5 text-sm text-foreground">{String(value)}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function DNAReport({ layers }: DNAReportProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {LAYER_META.map(({ key, label, Icon }) => {
        const layerData = layers[key];
        const hasData = layerData !== undefined && layerData !== null;

        return (
          <Card key={key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                {label}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {hasData ? (
                <LayerContent data={layerData as unknown as Record<string, unknown>} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  아직 분석되지 않았습니다
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
