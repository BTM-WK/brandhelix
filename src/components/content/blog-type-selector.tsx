'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BLOG_TYPES } from '@/types/blog';
import type { BlogType } from '@/types/blog';
import { cn } from '@/lib/utils';

interface BlogTypeSelectorProps {
  selectedType: BlogType | null;
  onSelect: (type: BlogType) => void;
}

export function BlogTypeSelector({ selectedType, onSelect }: BlogTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {BLOG_TYPES.map((config) => {
        const isSelected = selectedType === config.id;
        const { min, max } = config.lengthRange;
        const lengthLabel = `${min.toLocaleString()}~${max.toLocaleString()}자`;

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
                <span className="text-xs text-muted-foreground">{config.name}</span>
              </div>

              {/* 목적 설명 */}
              <p className="text-xs leading-snug text-muted-foreground line-clamp-2">
                {config.purposeKo}
              </p>

              {/* 글자 수 범위 배지 */}
              <div>
                <Badge variant="secondary" className="text-xs">
                  {lengthLabel}
                </Badge>
              </div>

              {/* 예시 제목 */}
              <p className="text-xs leading-snug text-muted-foreground/70 italic line-clamp-2">
                &ldquo;{config.example}&rdquo;
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
