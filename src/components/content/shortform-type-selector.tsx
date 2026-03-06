'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SHORTFORM_TYPES } from '@/types/shortform';
import type { ShortformType } from '@/types/shortform';
import { cn } from '@/lib/utils';

interface ShortformTypeSelectorProps {
  selectedType: ShortformType | null;
  onSelect: (type: ShortformType) => void;
}

export function ShortformTypeSelector({ selectedType, onSelect }: ShortformTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SHORTFORM_TYPES.map((config) => {
        const isSelected = selectedType === config.id;

        // 재생 시간 라벨
        const durationLabel =
          config.durationRange.min === config.durationRange.max
            ? `${config.durationRange.min}초`
            : `${config.durationRange.min}~${config.durationRange.max}초`;

        // 씬 수 라벨
        const sceneLabel =
          config.sceneCount.min === config.sceneCount.max
            ? `${config.sceneCount.min}씬`
            : `${config.sceneCount.min}~${config.sceneCount.max}씬`;

        // 구조 미리보기: 처음 3개 항목만 표시
        const structurePreview = config.structure.slice(0, 3);

        return (
          <Card
            key={config.id}
            onClick={() => onSelect(config.id)}
            className={cn(
              'transition-colors',
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
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

              {/* 목적 설명 */}
              <p className="text-xs leading-snug text-muted-foreground line-clamp-2">
                {config.purpose}
              </p>

              {/* 재생 시간 + 씬 수 배지 */}
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  {durationLabel}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {sceneLabel}
                </Badge>
              </div>

              {/* 구조 미리보기 (처음 3개 항목) */}
              <div className="mt-1 flex flex-col gap-0.5">
                {structurePreview.map((step, idx) => (
                  <span
                    key={idx}
                    className="truncate text-[10px] leading-tight text-muted-foreground/70"
                  >
                    {idx + 1}. {step}
                  </span>
                ))}
                {config.structure.length > 3 && (
                  <span className="text-[10px] leading-tight text-muted-foreground/50">
                    +{config.structure.length - 3}단계 더...
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
