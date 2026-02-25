'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { INSTAGRAM_TYPES } from '@/types/instagram';
import type { InstagramType } from '@/types/instagram';
import { cn } from '@/lib/utils';

interface InstagramTypeSelectorProps {
  selectedType: InstagramType | null;
  onSelect: (type: InstagramType) => void;
}

export function InstagramTypeSelector({ selectedType, onSelect }: InstagramTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {INSTAGRAM_TYPES.map((config) => {
        const isSelected = selectedType === config.id;
        const slideLabel =
          config.slideCount.min === config.slideCount.max
            ? `${config.slideCount.min}장`
            : `${config.slideCount.min}~${config.slideCount.max}장`;
        const sizeLabel = `${config.imageSize.width}×${config.imageSize.height}`;

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
                <span className="truncate text-xs text-muted-foreground">{config.name}</span>
              </div>

              {/* 목적 설명 */}
              <p className="text-xs leading-snug text-muted-foreground line-clamp-2">
                {config.purposeKo}
              </p>

              {/* 슬라이드 수 배지 + 이미지 사이즈 배지 */}
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  {slideLabel}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {sizeLabel}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
