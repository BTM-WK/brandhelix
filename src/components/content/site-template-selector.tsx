'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SITE_TEMPLATES } from '@/types/site';
import type { SiteTemplateType } from '@/types/site';
import { cn } from '@/lib/utils';

// ── Section Korean name mapping ─────────────────────────────────────────────
const SECTION_NAMES_KO: Record<string, string> = {
  hero: '히어로',
  features: '특장점',
  product_detail: '제품 상세',
  testimonials: '고객 후기',
  faq: 'FAQ',
  cta: 'CTA',
  brand_story: '브랜드 스토리',
  gallery: '갤러리',
  pricing: '가격표',
  footer: '푸터',
};

function getSectionNameKo(section: string): string {
  return SECTION_NAMES_KO[section] ?? section;
}

// ── Props ───────────────────────────────────────────────────────────────────
interface SiteTemplateSelectorProps {
  selected: SiteTemplateType | null;
  onSelect: (type: SiteTemplateType) => void;
}

// ── Component ───────────────────────────────────────────────────────────────
export function SiteTemplateSelector({ selected, onSelect }: SiteTemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {SITE_TEMPLATES.map((config) => {
        const isSelected = selected === config.id;

        return (
          <Card
            key={config.id}
            onClick={() => onSelect(config.id)}
            className={cn(
              'transition-colors',
              isSelected
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'cursor-pointer hover:border-primary/50'
            )}
          >
            <CardContent className="flex flex-col gap-2 p-4">
              {/* 헤더: 한국어 이름 + 영문 이름 */}
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold leading-tight text-foreground">
                  {config.nameKo}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {config.name}
                </span>
              </div>

              {/* 설명 */}
              <p className="text-xs leading-snug text-muted-foreground line-clamp-2">
                {config.description}
              </p>

              {/* 섹션 수 배지 */}
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-xs">
                  {config.recommendedSections}개 섹션
                </Badge>
              </div>

              {/* 섹션 구성 미리보기 */}
              <div className="flex flex-wrap gap-1 mt-1">
                {config.sections.map((section) => (
                  <Badge
                    key={section}
                    variant="outline"
                    className="text-[9px] px-1.5 py-0"
                  >
                    {getSectionNameKo(section)}
                  </Badge>
                ))}
              </div>

              {/* 목적 */}
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground/70">
                {config.purpose}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
